import { Router } from "express";
import verifyJWT from "../middlewares/auth.middleware";
import { readNotification } from "../controllers/notification.controller";

const router = Router();

router.route("/read").get(verifyJWT, readNotification);

export default router;