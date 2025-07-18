import Joi from "joi";

const reviewJoiSchema = Joi.object({
  doctorId: Joi.string().length(24).required(),
  appointmentId: Joi.string().length(24).required(), 
  rating: Joi.number().min(1).max(5).required(),
  comment: Joi.string().trim().min(5).max(500).optional(),
  createdAt: Joi.date().default(() => new Date()),
});

export default reviewJoiSchema;
