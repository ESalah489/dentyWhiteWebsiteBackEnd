import Joi from "joi";
/* ------------------------- update user information ------------------------ */
export const updateUserSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).optional().messages({
    "string.base": "First name must be a string",
    "string.min": "First name must be at least 2 characters",
    "string.max": "First name must be at most 50 characters",
  }),

  lastName: Joi.string().min(2).max(50).optional().messages({
    "string.base": "Last name must be a string",
    "string.min": "Last name must be at least 2 characters",
    "string.max": "Last name must be at most 50 characters",
  }),

  phone: Joi.string().min(6).max(20).optional().messages({
    "string.base": "Phone must be a string",
    "string.min": "Phone must be at least 6 characters",
    "string.max": "Phone must be at most 20 characters",
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
    city: Joi.string().optional().messages({
      "string.base": "City must be a string",
    }),
    street: Joi.string().optional().messages({
      "string.base": "Street must be a string",
    }),
    country: Joi.string().optional().messages({
      "string.base": "Country must be a string",
    }),
    postalCode: Joi.string().optional().messages({
      "string.base": "Postal code must be a string",
    }),
  }).optional(),
});

/* --------------------------- update role of user -------------------------- */
export const updateUserRoleSchema = Joi.object({
  role: Joi.string()
    .valid("client", "doctor", "admin")
    .required()
    .messages({
      "any.only": "Role must be either client, doctor, or admin",
      "string.empty": "Role is required",
    }),
});
/* --------------------- delete user by admin reqire id --------------------- */
export const deleteUserSchema = Joi.object({
  id: Joi.string().length(24).hex().required().messages({
    "string.length": "Invalid user ID format",
    "string.hex": "User ID must be a valid hexadecimal string",
    "any.required": "User ID is required",
  }),
});
