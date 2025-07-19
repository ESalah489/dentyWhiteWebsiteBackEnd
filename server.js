import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import "./DB/models/service.model.js";
import "./DB/models/user.model.js";
import "./DB/models/booking.model.js";
import { errorHandler } from "./src/middleware/errorHandllingMiddleware.js";
import db_connection from "./DB/DB-connection.js";
import AuthRoutes from "./src/modules/Auth/Auth.route.js";
import userInfo from "./src/modules/User/User.route.js";
import doctorInfo from "./src/modules/Doctor/doctor.route.js";
import services from "./src/modules/Services/services.route.js";
import category from "./src/modules/serviceCategory/serviceCategory.route.js";
import searchRoutes from "./src/modules/Search/search.route.js";
import searchServices from "./src/modules/Search/search.route.js";
import cron from 'node-cron';
import { autoCompleteAppointments } from './src/scheduler/autoCompleteAppointments.js';
import { sendReminders } from './src/scheduler/sendReminders.js';
import { autoExpireAppointments } from './src/scheduler/autoExpireAppointments.js';
import appointmentInfo from "./src/modules/Appointment/Appointment.route.js";
import paymentRoutes from "./src/modules/Payment/Payment.route.js";
import { stripeWebhook } from "./src/utils/stripeWebhook.js";
import statsRoutes from "./src/modules/Stats/Stats.route.js";
import reviewRoutes from "./src/modules/review/review.routes.js";
import galleryRoutes from "./src/modules/Gallary/gallary.route.js";

import * as reviewController from "./src/modules/review/review.controller.js";
dotenv.config();

const app = express();
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.post(
  "/webhook/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhook
);

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

/* --------------------------- Run every 15 mins/ reminders (cron) --------------------------- */
cron.schedule("*/15 * * * *", () => {
  console.log("⏱️ Running auto-complete appointment task...");
  autoCompleteAppointments();
});

cron.schedule("*/10 * * * *", () => {
  console.log("⏰ Sending appointment reminders...");
  sendReminders();
});


cron.schedule('*/15 * * * *', () => {
  console.log('🕒 Running auto-expire appointment task...');
  autoExpireAppointments();
});
/* --------------------------- Connect to MongoDB --------------------------- */
db_connection();
/* --------------------------------- Routes --------------------------------- */
app.use("/api/auth", AuthRoutes);
app.use("/api/user", userInfo);
app.use("/api/doctor", doctorInfo);
app.use("/api/services", services);
app.use("/api/category", category);
app.use("/api/search", searchRoutes);
app.use("/api/appointment", appointmentInfo);
app.use("/api/payments", paymentRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/gallery", galleryRoutes);

app.use("/api/review", reviewRoutes);
/* ------------------------ Error Handling from middleWare  ----------------------- */
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "127.0.0.1";
app.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});
