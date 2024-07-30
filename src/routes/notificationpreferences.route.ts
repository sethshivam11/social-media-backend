import { Router } from "express";
import verifyJWT from "../middlewares/auth.middleware";
import {
  getNotificationPreferences,
  saveFirebaseToken,
  updateNotificationPreferences,
} from "../controllers/notificationpreferences.controller";

const router = Router();

router.route("/saveToken").post(verifyJWT, saveFirebaseToken);

router
  .route("/updatePreferences")
  .patch(verifyJWT, updateNotificationPreferences);

router.route("/get").get(verifyJWT, getNotificationPreferences);

export default router;
