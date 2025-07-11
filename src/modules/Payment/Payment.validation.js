import Joi from 'joi';

export const validatePayment = (req, res, next) => {
  const schema = Joi.object({
    appointmentId: Joi.string().required(),
    paymentMethod: Joi.string().valid('cash', 'online').required(),
    gateway: Joi.when('paymentMethod', {
      is: 'online',
      then: Joi.string().valid('stripe', 'paymob', 'paypal').required(),
      otherwise: Joi.optional()
    })
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  next();
};
