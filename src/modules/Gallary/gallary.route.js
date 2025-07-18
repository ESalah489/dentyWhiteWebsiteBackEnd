import express from "express";
import { upload } from "../../middleware/upload.js";
import {
  uploadImage,
  getAllImages,
  deleteImage,
} from "./gallary.controller.js";
import { isAuth } from "../../middleware/isauthMiddleware.js";
import { allowRoles } from "../../middleware/checkRole.js";

const router = express.Router();

router.post(
  "/upload",
  isAuth,
  allowRoles("admin"),
  upload.single("image"),
  uploadImage
);
router.get("/", getAllImages);
router.delete("/:id", isAuth, allowRoles("admin"), deleteImage);

export default router;
