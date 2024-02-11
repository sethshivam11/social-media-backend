import { Router } from "express";
import verifyJWT from "../middlewares/auth.middleware";
import { follow, unfollow } from "../controllers/follow.controller";

const router = Router()

router.route("/follow/:followee").get(verifyJWT, follow)

router.route("/follow/:unfollowee").get(verifyJWT, unfollow)

export default router