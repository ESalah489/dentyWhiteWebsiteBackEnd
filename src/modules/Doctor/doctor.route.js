import express from "express";
import *as doctorController from "./doctor.controller.js";
import { validate,validateParams } from "../../middleware/validationMiddleware.js";
import {DoctorSchema,editDoctorSchema,doctorIdSchema} from "./doctor.validation.js";
import { isAuth } from "../../middleware/isauthMiddleware.js";
import { allowRoles } from "../../middleware/checkRole.js";
import{cleanBody } from "../../middleware/cleanBodyMiddleware.js";
import {upload} from "../../middleware/upload.js";
import {parseDoctorFields} from "../../middleware/fieldsToParse.js";

const router = express.Router();

router.get("/",doctorController.getAllDoctors);

router.get("/:id",
  validateParams(doctorIdSchema),
  doctorController.getDoctorById
);

router.post("/",
  isAuth,
  allowRoles("admin"),
upload.fields([
     { name: "profileImage", maxCount: 1 },
     { name: "workImages", maxCount: 5 },
  ]), 
   parseDoctorFields,
   validate(DoctorSchema),
  doctorController.createDoctor
);

router.put("/:id",
  isAuth,
  allowRoles("admin"),
  upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "workImages", maxCount: 5 },
  ]),
  cleanBody,
  parseDoctorFields,
  validateParams(doctorIdSchema),
  validate(editDoctorSchema),
  doctorController.editDoctorById
);

router.delete("/:id",
  isAuth,
  allowRoles("admin"),
  validateParams(doctorIdSchema),
  doctorController.deleteDoctorById
);

export default router;