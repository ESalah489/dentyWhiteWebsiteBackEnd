import GalleryImage from "../../../DB/models/Gallary.model.js";
import { v2 as cloudinary } from "cloudinary";

export const uploadImage = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ message: "No file uploaded" });

    const newImage = await GalleryImage.create({
      imageUrl: file.path,
      publicId: file.filename, 
    });

    res.status(201).json(newImage);
  } catch (err) {
    res.status(500).json({ error: "Upload failed", details: err.message });
  }
};

export const getAllImages = async (req, res) => {
  try {
    const images = await GalleryImage.find().sort({ createdAt: -1 });
    res.json(images);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const deleteImage = async (req, res) => {
  try {
    const { id } = req.params;
    const image = await GalleryImage.findById(id);
    if (!image) return res.status(404).json({ message: "Image not found" });

    console.log("Deleting image with ID:", id);
    console.log("Public ID to delete from Cloudinary:", image.publicId);

    const result = await cloudinary.uploader.destroy(image.publicId);
    console.log("Cloudinary destroy result:", result);

    await GalleryImage.findByIdAndDelete(id); 

    res.json({ message: "Image deleted successfully" });
  } catch (err) {
    console.error("Error in deleteImage:", err);
    res.status(500).json({ error: err.message });
  }
};
