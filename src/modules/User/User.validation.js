import Joi from "joi";

export const updateUserSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).optional(),
  lastName: Joi.string().min(2).max(50).optional(),
  image: Joi.string().uri().optional(),
  email: Joi.string().email().optional(),
  password: Joi.string().min(6).max(30).optional(),
  phone: Joi.string().min(6).max(20).optional(),
  age: Joi.number().min(1).max(120).optional(),
  clientWork: Joi.string().optional(),
  address: Joi.object({
    city: Joi.string().optional(),
    street: Joi.string().optional(),
    country: Joi.string().optional(),
    postalCode: Joi.string().optional(),
  }).optional(),
});
