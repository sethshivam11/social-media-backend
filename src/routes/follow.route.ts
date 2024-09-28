import { Router } from "express";
import verifyJWT from "../middlewares/auth.middleware";
import {
  follow,
  unfollow,
  getFollowers,
  getFollowings,
  getFollow,
} from "../controllers/follow.controller";

const router = Router();

router.route("/followers").get(getFollowers);

router.route("/following").get(getFollowings);

router.use(verifyJWT);

router.route("/new").get(follow);

router.route("/get").get(getFollow);

router.route("/unfollow").get(unfollow);

export default router;
