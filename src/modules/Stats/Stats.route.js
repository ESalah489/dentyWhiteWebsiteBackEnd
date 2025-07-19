import express from "express";
import { getCounts } from "../Stats/stats.controller.js";

const router = express.Router();

router.get("/counts", getCounts);

export default router;
