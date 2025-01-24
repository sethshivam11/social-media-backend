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
  updatePassword,
  getCurrentUser,
  isUsernameAvailable,
  removeAvatar,
  resendEmail,
  forgotPassword,
  getProfile,
  updateEmail,
  searchUsers,
  getBlockedUsers,
  getFollowSuggestions,
  savePost,
  unsavePost,
  getSavedPosts,
  getSessions,
  removeSession,
  clearCookies,
  removeAllSessions,
  removeInvalidUsers,
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

router.route("/getProfile").get(getProfile);

router.route("/clearCookies").get(clearCookies);

router.route("/removeInvalidUsers").get(removeInvalidUsers);

// Verified routes

router.use(verifyJWT);

router.route("/get").get(getCurrentUser);

router.route("/logout").get(logoutUser);

router.route("/updateAvatar").patch(upload.single("avatar"), updateAvatar);

router.route("/removeAvatar").get(removeAvatar);

router.route("/updateDetails").put(updateDetails);

router.route("/updateEmail").patch(updateEmail);

router.route("/updatePassword").patch(updatePassword);

router.route("/block").get(blockUser);

router.route("/unblock").get(unblockUser);

router.route("/search").get(searchUsers);

router.route("/blocked").get(getBlockedUsers);

router.route("/suggestions").get(getFollowSuggestions);

router.route("/save/:postId").get(savePost);

router.route("/unsave/:postId").get(unsavePost);

router.route("/saved").get(getSavedPosts);

router.route("/sessions").get(getSessions);

router.route("/removeSession/:sessionId").delete(removeSession);

router.route("/removeAllSessions").delete(removeAllSessions);

export default router;
