import express from 'express';
import { isAuth } from '../../middleware/isauthMiddleware.js';
import { allowRoles } from '../../middleware/checkRole.js';
import { validate } from '../../middleware/validationMiddleware.js';
import { createAppointmentschema } from './Appointment.validation.js';
import * as appointmentController from './Appointment.controller.js';

const router = express.Router(); 

router.post ('/',isAuth,
    allowRoles('admin', 'client'), 
    validate(createAppointmentschema), 
    appointmentController.createAppointment
)

router.get ('/slots',isAuth,
    allowRoles('admin', 'client'), 
    appointmentController.getSlotsStatus
)

router.get("/my", isAuth, 
    appointmentController.getMyAppointments);

router.patch ('/confirm/:id',isAuth, 
    allowRoles('admin'),
    appointmentController.confirmAppointment
)

router.patch ('/cancel/:id',isAuth, 
    allowRoles('admin', 'client'),
    appointmentController.cancelAppointment
)

router.get ('/',isAuth, 
    allowRoles('admin'),
    appointmentController.getAllAppointments
)

router.get ('/user/:userId',isAuth,
    appointmentController.getUserAppointments
)

router.get("/:id/allow-payment", isAuth, 
    appointmentController.allowPayment
)

router.patch ('/reschedule/:id',isAuth, 
    allowRoles('admin', 'client'),
    appointmentController.rescheduleAppointment
)

router.get ('/stats',isAuth,
    allowRoles('admin'), 
    appointmentController.getAppointmentStats
)

router.patch ('complete/:id', isAuth,
    allowRoles('admin'),
    appointmentController.markAppointmentCompleted
)

router.get ('/completed/list', isAuth,
    allowRoles('admin'),
    appointmentController.getCompletedAppointments
)

router.get ('/stats/status-count',isAuth,
    allowRoles('admin'), 
    appointmentController.getStatusStats
)

router.get('/reports/daily', isAuth, 
    allowRoles('admin'), 
    appointmentController.getDailyReport
);

router.patch('/no-show/:id', isAuth, 
    allowRoles('admin'), 
    appointmentController.markNoShow
);

router.get('/stats/no-show-count', isAuth, 
    allowRoles('admin'), 
    appointmentController.getNoShowStats
);

router.patch('/delay/:id', isAuth,
    allowRoles('admin'),
    appointmentController.delayAppointment
);

export default router;