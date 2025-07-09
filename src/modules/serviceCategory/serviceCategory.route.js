    import express, { Router } from "express";
    import *as serviceCategoryController from "./serviceCategory.controller.js";
    import { validate,validateParams } from "../../middleware/validationMiddleware.js";
    import { isAuth } from "../../middleware/isauthMiddleware.js";
    import { allowRoles } from "../../middleware/checkRole.js";
    import {categorySchema,serviceCategoryIdSchema } from "./serviceCategory.validation.js";

    const router=express.Router();

    router.get("/",serviceCategoryController.getServicesCategory);

    router.get(
        "/:id",
        validateParams(serviceCategoryIdSchema),
        serviceCategoryController.getServiceCategoryById
    );

    router.post(
        "/",
        isAuth,
        allowRoles("admin"),
        validate(categorySchema),
        serviceCategoryController.createServiceCategory
    );

    router.put(
        "/:id",
        isAuth,
        allowRoles("admin"),
        validateParams(serviceCategoryIdSchema),
        validate(categorySchema),
        serviceCategoryController.editServiceCategoryById
    );

    router.delete(
        "/:id",
        isAuth,
        allowRoles("admin"),
        validateParams(serviceCategoryIdSchema),
        serviceCategoryController.deleteServiceCategoryById
    );

    export default router;