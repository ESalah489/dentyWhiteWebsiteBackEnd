import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { errorHandler } from "./src/middleware/errorHandllingMiddleware.js";
import db_connection from "./DB/DB-connection.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

/* --------------------------- Connect to MongoDB --------------------------- */
db_connection();
/* --------------------------------- Routes --------------------------------- */

/* ------------------------ Error Handling from middleWare  ----------------------- */
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "127.0.0.1";
app.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});
