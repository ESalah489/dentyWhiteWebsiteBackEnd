import Joi from "joi";
import { isValidObjectId } from "../../utils/isValidObjectId.js"; 

export const categorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required().messages({
    "string.base": "Category name must be letters",
    "string.empty": "Category name is required",
    "string.min": "Category name must be at least 2 characters",
    "string.max": "Category name must be at most 50 characters",
    "any.required": "Category name is required",
  }),
  description: Joi.string().max(500).required().messages({
    "string.base": "Category description must be letters",
    "string.empty": "Category description is required",
    "string.max": "Category description must be at most 500 characters",
        "any.required": "Category description is required",

  }),
});

export const serviceCategoryIdSchema = Joi.object({
  id: Joi.string()
    .custom(isValidObjectId, "ObjectId Validation")
    .required()
    .messages({
      "string.base": "ID must be a string",
      "any.required": "ID is required",
      "any.invalid": "Invalid MongoDB ObjectId",
    }),
    });