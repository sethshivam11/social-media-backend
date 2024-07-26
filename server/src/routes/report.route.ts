import { Router } from "express";
import { createReport } from "../controllers/report.controller";

const router = Router();

router.route("/submit").post(createReport);

export default router;