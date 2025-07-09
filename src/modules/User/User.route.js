import express from "express";
import {
  getUserById,
  EditUserDataById,
  updateUserRole,
  getAllUsers,
  deleteUserById,
} from "../User/User.controller.js";
import { isAuth } from "../../middleware/isauthMiddleware.js";
import { allowRoles } from "../../middleware/checkRole.js";
import { upload } from "../../middleware/upload.js";
import {
  validate,
  validateParams,
} from "../../middleware/validationMiddleware.js";
import { updateUserRoleSchema, deleteUserSchema } from "./User.validation.js";

const router = express.Router();
router.get("/:id", isAuth, getUserById);
router.put("/:id", isAuth, upload.single("image"), EditUserDataById);
router.patch(
  "/update-role/:id",
  isAuth,
  allowRoles("admin"),
  validateParams(deleteUserSchema),
  validate(updateUserRoleSchema),
  updateUserRole
);
router.delete(
  "/:id",
  isAuth,
  allowRoles("admin"),
  validateParams(deleteUserSchema),
  deleteUserById
);
router.get("/", isAuth, allowRoles("admin"), getAllUsers);

export default router;
