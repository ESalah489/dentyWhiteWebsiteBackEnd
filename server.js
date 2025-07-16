import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { errorHandler } from "./src/middleware/errorHandllingMiddleware.js";
import db_connection from "./DB/DB-connection.js";
import AuthRoutes from "./src/modules/Auth/Auth.route.js";
import userInfo from "./src/modules/User/User.route.js";
import doctorInfo from "./src/modules/Doctor/doctor.route.js";
import reviewRoutes from "./src/modules/review/review.routes.js";

import * as reviewController from "./src/modules/review/review.controller.js"



dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

/* --------------------------- Connect to MongoDB --------------------------- */
db_connection();
/* --------------------------------- Routes --------------------------------- */
app.use("/api/auth", AuthRoutes);
app.use("/api/user", userInfo);
app.use("/api/doctor", doctorInfo);
app.use("/api/review", reviewRoutes);
/* ------------------------ Error Handling from middleWare  ----------------------- */
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "127.0.0.1";
app.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});
