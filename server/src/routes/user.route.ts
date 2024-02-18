import { Router } from "express"
import { upload } from "../middlewares/multer.middleware"
import { registerUser, loginUser, logoutUser, verifyEmail, updateAvatar, updateDetails, updateBlueTickStatus, blockUser, unblockUser, renewAccessToken, updatePassword, getCurrentUser, isUsernameAvailable, removeAvatar } from "../controllers/user.controller"
import verifyJWT from "../middlewares/auth.middleware"

const router = Router()

// Public routes

router.route("/register").post(
    upload.single("avatar"),
    registerUser)

router.route("/login").post(loginUser)

router.route("/usernameAvailable/:username").get(isUsernameAvailable)


// Verified routes

router.route("/get").get(verifyJWT, getCurrentUser)

router.route("/verifyMail").get(verifyJWT, verifyEmail)

router.route("/logout").post(verifyJWT, logoutUser)

router.route("/updateAvatar").patch(
    verifyJWT,
    upload.single("avatar"),
    updateAvatar)

router.route("/removeAvatar").get(verifyJWT, removeAvatar)

router.route("/updateDetails").put(verifyJWT, updateDetails)

router.route("/changePassword").patch(verifyJWT, updatePassword)

router.route("/updateBlue").get(verifyJWT, updateBlueTickStatus)

router.route("/block/:blockUserId").get(verifyJWT, blockUser)

router.route("/unblock/:unblockUserId").get(verifyJWT, unblockUser)

router.route("/renewAccessToken").post(renewAccessToken)

export default router