import Joi from "joi";

export const searchSchema = Joi.object({
  keyword: Joi.string().min(3).optional(),
  minPrice: Joi.number().optional(),
  maxPrice: Joi.number().optional(),
  sessions: Joi.string().optional(),
  sortBy: Joi.string().valid("price", "createdAt").optional(),
  order: Joi.string().valid("asc", "desc").optional(),
  page: Joi.number().min(1).optional(),
  limit: Joi.number().min(1).max(100).optional(),
});

export const searchSuggestionSchema = Joi.object({
  keyword: Joi.string().min(3).required().messages({
    "string.base": "Keyword must be a string",
    "string.min": "Please type at least 3 letter",
    "any.required": "Keyword is required",
  }),
});

export const searchDoctorsSchema = Joi.object({
  keyword: Joi.string().min(2).optional(),
  specialization: Joi.string().optional(),
  sortBy: Joi.string().valid("createdAt", "experience").optional(),
  order: Joi.string().valid("asc", "desc").optional(),
  page: Joi.number().min(1).optional(),
  limit: Joi.number().min(1).max(100).optional(),
});