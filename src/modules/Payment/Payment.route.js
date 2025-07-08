import express from 'express';
import { initiatePayment, verifyPayment } from './Payment.controller.js';
import { isAuth } from '../../middleware/isauthMiddleware.js';
import { validatePayment } from './Payment.validation.js';

const router = express.Router();

router.post('/initiate', isAuth, validatePayment, initiatePayment);
router.get('/:paymentId/verify', isAuth, verifyPayment);

export default router;
