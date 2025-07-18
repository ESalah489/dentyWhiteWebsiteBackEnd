import Joi from "joi";
import { isValidObjectId } from "../../../utils/isValidObjectId.js"; 

export const DoctorSchema = Joi.object({
  userId: Joi.string().length(24).hex().required().messages({
    "string.base": "User ID must be a string",
    "string.length": "User ID must be 24 characters",
    "string.hex": "User ID must be a valid ObjectId",
    "any.required": "User ID is required",
  }),

  specialization: Joi.array()
    .items(Joi.string().min(2).max(100))
    .min(1)
    .required()
    .messages({
      "array.base": "Specialization must be an array of strings",
      "array.min": "At least one specialization is required",
      "any.required": "Specialization is required",
    }),

  experience: Joi.number().min(0).max(80).required().messages({
    "number.base": "Experience must be a number",
    "number.min": "Experience must be at least 0 years",
    "number.max": "Experience must be at most 80 years",
    "any.required": "Experience is required",
  }),

  certifications: Joi.array()
    .items(Joi.string().min(2).max(100))
    .min(1)
    .required()
    .messages({
      "array.base": "Certifications must be an array of strings",
      "array.min": "At least one certification is required",
      "any.required": "Certifications are required",
    }),

  bio: Joi.string().max(1000).required().messages({
    "string.base": "Bio must be a string",
    "string.max": "Bio must be at most 1000 characters",
    "any.required": "Bio is required",
  }),

  services: Joi.array()
    .items(Joi.string().length(24).hex())
    .min(1)
    .messages({
      "array.base": "Services must be an array of valid ObjectIds",
      "array.min": "At least one service is required",
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
          .min(1)
          .required()
          .messages({
            "array.base": "Slots must be an array of time ranges",
            "any.required": "Slots are required",
          }),
      })
    )
    .min(1)
    .required()
    .messages({
      "array.base": "AvailableTimes must be an array of objects",
      "array.min": "At least one available day is required",
      "any.required": "AvailableTimes is required",
    }),
        type: Joi.string()
        .valid("doctor")
        .optional(),
});


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
    profileImage: Joi.string().uri().optional().messages({
  "string.uri": "Profile image must be a valid URL"
}),

workImages: Joi.array().items(Joi.string().uri()).optional().messages({
  "array.base": "Work images must be an array of URLs"
}),

services: Joi.array()
  .items(Joi.string().length(24).hex())
  .optional()
  .messages({
    "string.length": "Each service ID must be 24 characters",
    "string.hex": "Service ID must be a valid ObjectId"
  }),
type: Joi.string()
        .valid("doctor")
        .optional(),

});

export const doctorIdSchema = Joi.object({
  id:Joi.string()
   .custom(isValidObjectId,"ObjectId Validation")
   .required()
   .messages({
   " string.base":"ID must be a string",
   "any.required":"ID is required",
   "any.invalid":"ID must be a valid MongoDB ObjectId"
   })
});