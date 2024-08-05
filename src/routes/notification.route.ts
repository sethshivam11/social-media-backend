import { Router } from "express";
import verifyJWT from "../middlewares/auth.middleware";
import {
  deleteNotification,
  getNotifications,
  readNotification,
} from "../controllers/notification.controller";

const router = Router();

router.use(verifyJWT);

router.route("/").get(getNotifications);

router.route("/read").get(readNotification);

router.route("/delete/:notificationId").delete(deleteNotification);

export default router;
