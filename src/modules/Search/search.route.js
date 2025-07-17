import express from "express";
import { searchServices, searchDoctors, getDoctorSuggestions,getServiceSuggestions } from "./search.controller.js";
import { validateQuery } from "../../middleware/validationMiddleware.js";
import { searchSchema,searchSuggestionSchema,searchDoctorsSchema } from "./search.validation.js";

const router = express.Router();

router.get("/", 
    validateQuery(searchSchema),
     searchServices);
     
router.get("/doctors", 
    validateQuery(searchDoctorsSchema),
    searchDoctors );

router.get("/suggestions/doctors", 
    validateQuery(searchSuggestionSchema),
     getDoctorSuggestions);

router.get("/suggestions/services",
     validateQuery(searchSuggestionSchema),
      getServiceSuggestions);


export default router;



