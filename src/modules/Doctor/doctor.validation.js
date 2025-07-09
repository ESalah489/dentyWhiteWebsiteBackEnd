import Joi from "joi";

export const editDoctorSchema = Joi.object({
  specialization: Joi.array()
    .items(Joi.string().min(2).max(100))
    .optional()
    .messages({
      "string.base": "Each specialization must be a string",
      "string.min": "Specialization must be at least 2 characters",
      "string.max": "Specialization must be at most 100 characters",
    }),

  experience: Joi.number().min(0).max(80).optional().messages({
    "number.base": "Experience must be a number",
    "number.min": "Experience must be at least 0 years",
    "number.max": "Experience must be at most 80 years",
  }),

  certifications: Joi.array()
    .items(Joi.string().min(2).max(100))
    .optional()
    .messages({
      "array.base": "Certifications must be an array of strings",
    }),

  bio: Joi.string().max(1000).optional().messages({
    "string.base": "Bio must be a string",
    "string.max": "Bio must be at most 1000 characters",
  }),

  availableTimes: Joi.array()
    .items(
      Joi.object({
        day: Joi.string().required().messages({
          "string.base": "Day must be a string",
          "any.required": "Day is required",
        }),
        slots: Joi.array()
          .items(
            Joi.object({
              from: Joi.string().required().messages({
                "string.base": "From must be a string",
                "any.required": "From is required",
              }),
              to: Joi.string().required().messages({
                "string.base": "To must be a string",
                "any.required": "To is required",
              }),
            })
          )
          .required()
          .messages({
            "array.base": "Slots must be an array of time ranges",
            "any.required": "Slots are required",
          }),
      })
    )
    .optional()
    .messages({
      "array.base": "AvailableTimes must be an array of objects",
    }),
});

/* ------------------------------ delete doctor ----------------------------- */
export const deleteDoctorSchema = Joi.object({
  id: Joi.string().length(24).hex().required().messages({
    "string.base": "Doctor ID must be a string",
    "string.length": "Doctor ID must be exactly 24 characters",
    "string.hex": "Doctor ID must be a valid hexadecimal string",
    "any.required": "Doctor ID is required",
  }),
});
