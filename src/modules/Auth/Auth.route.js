import express from "express";
import {
  register,
  login,
  logout,
  forgetPassword,
  resetPassword,
} from "../Auth/Auth.controller.js";
import {validate} from "../../middleware/validationMiddleware.js";
import { isAuth } from "../../middleware/isauthMiddleware.js";
import { registerSchema,loginSchema,forgetSchema,resetSchema } from "./Auth.validation.js";

const router = express.Router();

router.post("/register",validate(registerSchema), register);

router.post("/login",validate(loginSchema), login);

router.post("/logout", isAuth, logout);

router.post("/forget-password",validate(forgetSchema), forgetPassword);

router.post("/reset-password/:token",validate(resetSchema), resetPassword);

export default router;
