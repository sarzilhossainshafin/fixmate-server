
export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select an image to upload.",
      });
    }

    const apiKey = process.env.IMGBB_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: "Image upload service is not configured.",
      });
    }

    const formData = new FormData();

    const imageBlob = new Blob([req.file.buffer], {
      type: req.file.mimetype,
    });

    formData.append("image", imageBlob, req.file.originalname);

    const response = await fetch(
      `https://api.imgbb.com/1/upload?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        body: formData,
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      return res.status(502).json({
        success: false,
        message: "Image upload to ImgBB failed.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Image uploaded successfully!",
      image: {
        url: result.data.display_url || result.data.url,
        deleteUrl: result.data.delete_url,
      },
    });
  } catch (error) {
    console.error("Image upload error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while uploading the image.",
    });
  }
};
