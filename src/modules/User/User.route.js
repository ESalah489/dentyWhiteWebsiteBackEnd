import express from "express";
import {
  getUserById,
  EditUserDataById,
  updateUserRole,
} from "../User/User.controller.js";
import { isAuth } from "../../middleware/isauthMiddleware.js";
import { allowRoles } from "../../middleware/checkRole.js";

const router = express.Router();

router.get("/:id", isAuth, getUserById);

router.put("/:id", isAuth, EditUserDataById);

router.put("/:id", isAuth, allowRoles("admin"), updateUserRole);

export default router;
