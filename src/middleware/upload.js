import multer from "multer";
import {storage} from "../../utils/cloudinary.js";

export const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 5 },
});
