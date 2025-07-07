import express from "express";
import {
  getDoctorById,
  editDoctorById,
  deleteDoctorById,
  getAllDoctors,
  createDoctor,
} from "../Doctor/doctor.controller.js";
import { isAuth } from "../../middleware/isauthMiddleware.js";
import { allowRoles } from "../../middleware/checkRole.js";
import {
  validate,
  validateParams,
} from "../../middleware/validationMiddleware.js";
import { editDoctorSchema, deleteDoctorSchema } from "./doctor.validation.js";
const router = express.Router();
router.post("/", isAuth, allowRoles("admin"), createDoctor);

router.get("/:id", isAuth, getDoctorById);

router.patch("/:id", isAuth, validate(editDoctorSchema), editDoctorById);

router.delete(
  "/:id",
  isAuth,
  allowRoles("admin"),
  validateParams(deleteDoctorSchema),
  deleteDoctorById
);

router.get("/", isAuth, allowRoles("admin"), getAllDoctors);

export default router;
