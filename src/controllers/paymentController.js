
import Stripe from "stripe";
import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe secret key is not configured.");
  }

  return new Stripe(process.env.STRIPE_SECRET_KEY);
};

// Customer: Create Stripe Checkout Session
const createCheckoutSession = async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId || !ObjectId.isValid(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "A valid booking ID is required.",
      });
    }

    const db = getDB();

    const booking = await db.collection("bookings").findOne({
      _id: new ObjectId(bookingId),
      customerEmail: req.user.email,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    if (booking.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Payment is only allowed for completed bookings.",
      });
    }

    if (booking.paymentStatus === "paid") {
      return res.status(409).json({
        success: false,
        message: "This booking has already been paid.",
      });
    }

    const amount = Number(booking.finalAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking amount.",
      });
    }

    const frontendUrl =
      process.env.CLIENT_URL || "http://localhost:3000";

    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],

      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: booking.serviceTitle,
              description: `FixMate repair booking ${booking._id}`,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],

      metadata: {
        bookingId: booking._id.toString(),
        customerEmail: req.user.email,
      },

      customer_email: req.user.email,

      success_url: `${frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/payment/cancel`,
    });

    res.status(201).json({
      success: true,
      message: "Stripe Checkout Session created successfully.",
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error("Create checkout session error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to create checkout session.",
    });
  }
};

// Customer: Verify Stripe payment after successful checkout
const verifyCheckoutSession = async (req, res) => {
  try {
    const { session_id: sessionId } = req.query;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "Stripe session ID is required.",
      });
    }

    const stripe = getStripe();
    const db = getDB();

    const session =
      await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return res.status(400).json({
        success: false,
        message: "Payment has not been completed.",
      });
    }

    const bookingId = session.metadata?.bookingId;
    const customerEmail = session.metadata?.customerEmail;

    if (
      !bookingId ||
      !ObjectId.isValid(bookingId) ||
      customerEmail !== req.user.email
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to verify this payment.",
      });
    }

    const booking = await db.collection("bookings").findOne({
      _id: new ObjectId(bookingId),
      customerEmail: req.user.email,
      status: "completed",
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Completed booking not found.",
      });
    }

    const payments = db.collection("payments");

    // Prevent duplicate payment records
    await payments.createIndex({ bookingId: 1 }, { unique: true });
    await payments.createIndex({ stripeSessionId: 1 }, { unique: true });

    let payment = await payments.findOne({
      bookingId: booking._id.toString(),
    });

    if (!payment) {
      const transactionId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id;

      const paymentRecord = {
        bookingId: booking._id.toString(),
        customerEmail: booking.customerEmail,
        technicianName: booking.technicianName || "",
        technicianEmail: booking.technicianEmail,
        amount: Number(booking.finalAmount),
        currency: "usd",
        transactionId: transactionId || "",
        stripeSessionId: session.id,
        paymentStatus: "paid",
        paidAt: new Date(),
      };

      try {
        const result = await payments.insertOne(paymentRecord);
        payment = {
          _id: result.insertedId,
          ...paymentRecord,
        };
      } catch (error) {
        if (error.code !== 11000) {
          throw error;
        }

        payment = await payments.findOne({
          bookingId: booking._id.toString(),
        });
      }
    }

    // Update booking only after Stripe confirms payment
    await db.collection("bookings").updateOne(
      { _id: booking._id },
      {
        $set: {
          paymentStatus: "paid",
          updatedAt: new Date(),
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully.",
      payment,
    });
  } catch (error) {
    console.error("Verify payment error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to verify payment.",
    });
  }
};

export {
  createCheckoutSession,
  verifyCheckoutSession,
};
