import { Router } from "express";
import verifyJWT from "../middlewares/auth.middleware";
import {
  deleteAllNotifications,
  deleteNotification,
  getNotifications,
} from "../controllers/notification.controller";

const router = Router();

router.use(verifyJWT);

router.route("/").get(getNotifications);

router.route("/deleteAll").delete(deleteAllNotifications);

router.route("/:notificationId").delete(deleteNotification);

export default router;
