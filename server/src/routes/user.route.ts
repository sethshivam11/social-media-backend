import { Router } from "express"
import { upload } from "../middlewares/multer.middleware"
import { registerUser, loginUser, logoutUser, verifyEmail, updateAvatar, updateDetails, updateBlueTickStatus, blockUser, unblockUser, renewAccessToken, updatePassword, getCurrentUser, isUsernameAvailable } from "../controllers/user.controller"
import verifyJWT from "../middlewares/auth.middleware"

const router = Router()

router.route("/register").post(
    upload.single("avatar"),
    registerUser)


router.route("/login").post(loginUser)

router.route("/get").get(verifyJWT, getCurrentUser)

router.route("/verifyMail").get(verifyJWT, verifyEmail)

router.route("/logout").post(verifyJWT, logoutUser)

router.route("/updateAvatar").post(
    upload.single("avatar"),
    updateAvatar)

router.route("/updateDetails").post(verifyJWT, updateDetails)

router.route("/changePassword").post(verifyJWT, updatePassword)

router.route("/updateBlue").get(verifyJWT, updateBlueTickStatus)

router.route("/block/:blockUserId").get(verifyJWT, blockUser)

router.route("/block/:unblockUserId").get(verifyJWT, unblockUser)

router.route("/renewAcessToken").post(renewAccessToken)

router.route("/usernameAvailable/:username").get(isUsernameAvailable)

export default router