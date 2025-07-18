import mongoose from "mongoose";

const galleryImageSchema = new mongoose.Schema(
  {
    imageUrl: { type: String, required: true },
    publicId: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("GalleryImage", galleryImageSchema);
