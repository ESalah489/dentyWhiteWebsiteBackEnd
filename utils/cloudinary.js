import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import dotenv from "dotenv";
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => {
    let folderName = "general";

    if (req.body.type === "doctor") {
      if (file.fieldname === "profileImage") {
        folderName = "doctors/profileImages";
      } else if (file.fieldname === "workImages") {
        folderName = "doctors/workImages";
      } else {
        folderName = "doctors/others";
      }
    }
    if (req.body.type === "service") folderName = "services";
    if (req.body.type === "users") folderName = "users";
    if (req.body.type === "gallery") folderName = "gallery";

    return {
      folder: folderName,
      allowed_formats: ["jpg", "png", "jpeg", "webp"],
      transformation: [{ width: 500, height: 500, crop: "limit" }],
    };
  },
});
