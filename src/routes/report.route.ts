import { Router } from "express";
import { createReport } from "../controllers/report.controller";
import verifyJWT from "../middlewares/auth.middleware";
import { upload } from "../middlewares/multer.middleware";

const router = Router();

router.route("/submit").post(upload.single("image"), verifyJWT, createReport);

export default router;
