import { Router } from "express";
import verifyJWT from "../middlewares/auth.middleware";
import {
  createStory,
  deleteStory,
  getStories,
  getUserStory,
  likeStory,
  markSelfSeen,
  seenStory,
  unlikeStory,
} from "../controllers/story.controller";
import { upload } from "../middlewares/multer.middleware";

const router = Router();

router.use(verifyJWT);

router.route("/").get(getStories);

router.route("/user").get(getUserStory);

router.route("/seen/:storyId").patch(seenStory);

router.route("/markSelfSeen").patch(markSelfSeen);

router.route("/like/:storyId").patch(likeStory);

router.route("/unlike/:storyId").patch(unlikeStory);

router.route("/new").post(upload.array("media", 5), createStory);

router.route("/delete/:storyId").delete(deleteStory);

export default router;
