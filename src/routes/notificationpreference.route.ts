import { Router } from "express";
import verifyJWT from "../middlewares/auth.middleware";
import {
  checkTokenExistence,
  deleteFirebaseToken,
  getNotificationPreferences,
  saveFirebaseToken,
  updateFirebaseToken,
  updateNotificationPreferences,
} from "../controllers/notificationpreferences.controller";

const router = Router();

router.use(verifyJWT);

router.route("/saveToken").post(saveFirebaseToken);

router
  .route("/updatePreferences")
  .put(updateNotificationPreferences);

router.route("/checkToken/:token").get(checkTokenExistence);

router.route("/updateToken").patch(updateFirebaseToken);

router.route("/deleteToken/:token").delete(deleteFirebaseToken); 

router.route("/get").get(getNotificationPreferences);

export default router;
