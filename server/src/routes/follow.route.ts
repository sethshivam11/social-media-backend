import { Router } from "express";
import verifyJWT from "../middlewares/auth.middleware";
import { follow, getFollowers, unfollow, getFollowing } from "../controllers/follow.controller";

const router = Router()

router.use(verifyJWT)

router.route("/").post(follow)

router.route("/unfollow").post(unfollow)

router.route("/getFollowers").get(getFollowers)

router.route("/getFollowing").get(getFollowing)

export default router