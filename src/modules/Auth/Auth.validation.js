import Joi from "joi";

export const registerSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).required().trim(),
  lastName: Joi.string().min(2).max(50).required().trim(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(30).required(),
  role: Joi.string().valid("client", "doctor", "admin"),
  phone: Joi.string().min(6).max(20),
  age: Joi.number().min(1).max(120),
  clientWork: Joi.string().optional(),
  address: Joi.object({
    city: Joi.string().optional(),
    street: Joi.string().optional(),
    country: Joi.string().optional(),
    postalCode: Joi.string().optional(),
  }),
});
