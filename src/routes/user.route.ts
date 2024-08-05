import { Router } from "express";
import { upload } from "../middlewares/multer.middleware";
import {
  registerUser,
  loginUser,
  logoutUser,
  verifyEmail,
  updateAvatar,
  updateDetails,
  blockUser,
  unblockUser,
  renewAccessToken,
  updatePassword,
  getCurrentUser,
  isUsernameAvailable,
  removeAvatar,
  resendEmail,
  forgotPassword,
  getProfile,
} from "../controllers/user.controller";
import verifyJWT from "../middlewares/auth.middleware";

const router = Router();

// Public routes

router.route("/register").post(upload.single("avatar"), registerUser);

router.route("/login").post(loginUser);

router.route("/usernameAvailable/:username").get(isUsernameAvailable);

router.route("/verify").get(verifyEmail);

router.route("/resendMail").get(resendEmail);

router.route("/forgotPassword").post(forgotPassword);

router.route("/renewAccessToken").post(renewAccessToken);

// Verified routes

router.use(verifyJWT);

router.route("/getProfile").get(getProfile);

router.route("/get").get(getCurrentUser);

router.route("/logout").get(logoutUser);

router.route("/updateAvatar").patch(upload.single("avatar"), updateAvatar);

router.route("/removeAvatar").get(removeAvatar);

router.route("/updateDetails").put(updateDetails);

router.route("/updatePassword").patch(updatePassword);

router.route("/block/:blockUserId").get(blockUser);

router.route("/unblock/:unblockUserId").get(unblockUser);

router.route("/search").get(getCurrentUser);

export default router;
