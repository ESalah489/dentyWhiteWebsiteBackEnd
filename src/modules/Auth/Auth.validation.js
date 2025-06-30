import Joi from "joi";

export const registerSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).required().trim().messages({
    "string.base": "First name must be a string",
    "string.empty": "First name is required",
    "string.min": "First name must be at least 2 characters",
    "string.max": "First name must be less than or equal to 50 characters",
  }),

  lastName: Joi.string().min(2).max(50).required().trim().messages({
    "string.base": "Last name must be a string",
    "string.empty": "Last name is required",
    "string.min": "Last name must be at least 2 characters",
    "string.max": "Last name must be less than or equal to 50 characters",
  }),

  email: Joi.string()
    .email({ tlds: { allow: false } })
    .pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
    .required()
    .messages({
      "string.email": "Email must be a valid email address",
      "string.pattern.base": "Email format is invalid",
      "string.empty": "Email is required",
    }),

  password: Joi.string()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/)
    .required()
    .messages({
      "string.pattern.base":
        "Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, 1 special character (!@#$%^&*), and be at least 8 characters long.",
      "string.empty": "Password is required",
    }),

  role: Joi.string().valid("client", "doctor", "admin").optional().messages({
    "any.only": 'Role must be one of: "client", "doctor", "admin"',
  }),

  phone: Joi.string().min(6).max(20).optional().messages({
    "string.min": "Phone number must be at least 6 digits",
    "string.max": "Phone number must not exceed 20 digits",
  }),

  age: Joi.number().min(1).max(120).optional().messages({
    "number.base": "Age must be a number",
    "number.min": "Age must be at least 1",
    "number.max": "Age must be less than or equal to 120",
  }),

  clientWork: Joi.string().optional().messages({
    "string.base": "Client work must be a string",
  }),

  address: Joi.object({
    city: Joi.string()
      .optional()
      .messages({ "string.base": "City must be a string" }),
    street: Joi.string()
      .optional()
      .messages({ "string.base": "Street must be a string" }),
    country: Joi.string()
      .optional()
      .messages({ "string.base": "Country must be a string" }),
    postalCode: Joi.string()
      .optional()
      .messages({ "string.base": "Postal code must be a string" }),
  }).optional(),
});
/* ------------------------------ login schema ------------------------------ */
export const loginSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      "string.email": "Email must be valid",
      "string.empty": "Email is required",
    }),

  password: Joi.string()
    .required()
    .messages({
      "string.empty": "Password is required",
    }),
});
/* ----------------------------- forgetPassword ----------------------------- */
export const forgetSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      "string.email": "Email must be valid",
      "string.empty": "Email is required",
    }),
});
/* ------------------------------ resetPassword ----------------------------- */
export const resetSchema = Joi.object({
  newPassword: Joi.string()
    .pattern(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/
    )
    .required()
    .messages({
      "string.empty": "New password is required",
      "string.pattern.base":
        "Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, 1 special character (!@#$%^&*), and be at least 8 characters long.",
    }),
});
