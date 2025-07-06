import express from "express";
import * as serviceController from "./services.controller.js";
import { validate,validateParams } from "../../middleware/validationMiddleware.js";
import { servicesSchema, servicesIdSchema,updateServiceSchema } from "./services.validation.js";
import { isAuth } from "../../middleware/isauthMiddleware.js";
import { allowRoles } from "../../middleware/checkRole.js";
import upload from "../../middleware/upload.js"
const router = express.Router();

router.get("/", serviceController.getAllServices);

router.get(
  "/:id",
  validateParams(servicesIdSchema),
  serviceController.getServiceById
);

router.post(
  "/",
  isAuth,
  allowRoles("admin"),
  upload.single("image"),
  validate(servicesSchema),
  serviceController.createServices
);

router.put(
  "/:id",
  isAuth,
  allowRoles("admin"),
  validate(updateServiceSchema),
  serviceController.editServiceById
);

router.delete(
  "/:id",
  isAuth,
  allowRoles("admin"),
  validateParams(servicesIdSchema),
  serviceController.deleteServiceById
);

export default router;
