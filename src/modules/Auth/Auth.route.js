import express from "express";
import {
  register,
  login,
  logout,
  forgetPassword,
  resetPassword,
} from "../Auth/Auth.controller.js";
import validate from "../../middleware/validationMiddleware.js";
import { isAuth } from "../../middleware/isauthMiddleware.js";

const router = express.Router();

router.post("/register", register);

router.post("/login", login);

router.post("/logout", isAuth, logout);

router.post("/forget-password", forgetPassword);

router.post("/reset-password/:token", resetPassword);

export default router;
