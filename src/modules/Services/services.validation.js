import Joi from "joi";
import { isValidObjectId } from "../../utils/isValidObjectId.js"; 

 export const servicesSchema=Joi.object({
    name:Joi.string().trim().min(2).max(50).required().messages({
     "string.base":"Service name must be letters",
     "string.empty":"Service name is required!!",
     "string.min":"Service name must be at least 2 characters",
    "string.max": "Service name must be at most 50 characters",
    "any.required": "Name is required",
    }),
    description:Joi.string().trim().min(2).max(1000).required().messages({
    "string.base": "Description must be a string",
    "string.empty": "Description cannot be empty",
    "string.min":"Description must be at least 2 characters",
    "string.max": "Description must be at most 1000 characters",
    "any.required": "Description is required",
    }),
    price: Joi.number().positive().precision(2).required().messages({
    "number.base": "Price must be a number",
    "number.positive": "Price must be greater than zero",
    "any.required": "Price is required",
  }),
   sessions: Joi.string().min(1).max(50).messages({
    "string.base": "Duration must be a string",
    "string.min":"Session must be at least 1 characters",
    "string.max": "Session must be at most 50 characters",
  }),
   duration: Joi.string().min(1).max(50).required().messages({
    "string.base": "Duration must be a string",
    "string.empty": "Duration is required",
    "string.max": "Duration can't exceed 50 characters",
    "any.required": "Duration is required",
  }),
   doctors: Joi.array()
    .items(
      Joi.string()
        .custom(isValidObjectId, "ObjectId Validation")
        .messages({ "any.invalid": "Each doctor ID must be a valid ObjectId" })
    )
    .min(1)
    .required()
    .messages({
      "array.base": "Doctors must be an array",
      "array.min": "At least one doctor must be assigned",
      "any.required": "Doctors field is required",
    }),
    category: Joi.string()
    .custom(isValidObjectId, "ObjectId Validation")
    .required()
    .messages({
      "any.required": "Category is required",
      "any.invalid": "Category ID must be a valid MongoDB ObjectId",
    }),

});


export const updateServiceSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50),
  description: Joi.string().trim().min(2).max(1000),
  price: Joi.number().positive().precision(2),
  sessions: Joi.string().min(2).max(50),
  duration: Joi.string().min(1).max(50),
  doctors: Joi.array().items(
    Joi.string().custom(isValidObjectId).messages({ "any.invalid": "Invalid doctor ID" })
  ),
  category: Joi.string().custom(isValidObjectId).messages({ "any.invalid": "Invalid category ID" }),
});


export const servicesIdSchema = Joi.object({
  id:Joi.string()
   .custom(isValidObjectId,"ObjectId Validation")
   .required()
   .messages({
   " string.base":"ID must be a string",
   "any.required":"ID is required",
   "any.invalid":"ID must be a valid MongoDB ObjectId"
   })
})
