import Joi from 'joi';

export const createAppointmentschema = Joi.object({
    doctor: Joi.string().required(),
    service: Joi.string().required(),
    date: Joi.date().required(),
    startTime: Joi.string().required(),
    endTime: Joi.string().required(),
    paymentMethod: Joi.string().valid('cash', 'online').required(),
    amount: Joi.number(),
    notes: Joi.string().max(1000).optional(),

    patientInfo: Joi.when(Joi.ref('$isAdmin'),{
        is: true,
        then: Joi.object({
            firstName: Joi.string().required(),
            lastName: Joi.string().required(),
            email: Joi.string().email().optional(),
            phone: Joi.string()
            .pattern(/^01[0125][0-9]{8}$/)
            .required()
            .messages({
                'string.pattern.base': 'Phone number must be a valid Egyptian mobile number (e.g., 01012345678).',
            }),
            age: Joi.number().min(1).required().messages({
            'number.min': 'Age must be at least 1 year.',
            }),
        }).required(),
        otherwise: Joi.forbidden(),
    })
}); 