import Joi from "joi";

export const searchSchema = Joi.object({
  keyword: Joi.string().min(2).optional(),
  category: Joi.string().optional(),
  minPrice: Joi.number().optional(),
  maxPrice: Joi.number().optional(),
  sessions: Joi.string().optional(),
  sortBy: Joi.string().valid("price", "createdAt").optional(),
  order: Joi.string().valid("asc", "desc").optional(),
  page: Joi.number().min(1).optional(),
  limit: Joi.number().min(1).max(100).optional(),
});

export const searchSuggestionSchema = Joi.object({
  keyword: Joi.string().min(1).required().messages({
    "string.base": "Keyword must be a string",
    "string.min": "Please type at least one letter",
    "any.required": "Keyword is required",
  }),
});
