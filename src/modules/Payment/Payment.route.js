import express from 'express';
import { initiatePayment, verifyPayment, paymobCallbackHandler } from './Payment.controller.js';
import { isAuth } from '../../middleware/isauthMiddleware.js';
import { validatePayment } from './Payment.validation.js';

const router = express.Router();

router.post('/initiate', isAuth, validatePayment, initiatePayment);
router.get('/verify/:paymentId', isAuth, verifyPayment);
// router.post('/callback', paymobCallbackHandler);

router.post('/callback', (req, res, next) => {
  console.log("🔥 Incoming callback request...");
  next();
}, paymobCallbackHandler);


export default router;
