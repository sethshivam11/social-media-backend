import { Router } from "express";
import verifyJWT from "../middlewares/auth.middleware";
import { follow, getFollowers, unfollow, getFollowing } from "../controllers/follow.controller";

const router = Router()

router.use(verifyJWT)

router.route("/new/:followee").post(follow)

router.route("/unfollow/:unfollowee").post(unfollow)

router.route("/getFollowers").get(getFollowers)

router.route("/getFollowing").get(getFollowing)

export default router