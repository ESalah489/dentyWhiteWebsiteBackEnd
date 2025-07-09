import express from "express";
import { searchServices,getSuggestions } from "./search.controller.js";
import { validateQuery } from "../../middleware/validationMiddleware.js";
import { searchSchema,searchSuggestionSchema } from "./search.validation.js";

const router = express.Router();

router.get("/", validateQuery(searchSchema), searchServices);
router.get("/suggestions", validateQuery(searchSuggestionSchema), getSuggestions);

export default router;



