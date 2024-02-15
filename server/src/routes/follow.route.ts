import { Router } from "express";
import verifyJWT from "../middlewares/auth.middleware";
import { follow, unfollow } from "../controllers/follow.controller";

const router = Router()

router.use(verifyJWT)

router.route("/follow/:followee").get(follow)

router.route("/follow/:unfollowee").get(unfollow)

export default router