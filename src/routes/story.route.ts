import { Router } from "express";
import verifyJWT from "../middlewares/auth.middleware";
import {
  createStory,
  deleteExpiredImages,
  deleteStory,
  getStories,
  getUserStory,
  likeStory,
  markSelfSeen,
  replyStory,
  seenStory,
  unlikeStory,
} from "../controllers/story.controller";
import { upload } from "../middlewares/multer.middleware";

const router = Router();

router.route("/deleteExpiredImages").get(deleteExpiredImages);

router.use(verifyJWT);

router.route("/").get(getStories);

router.route("/user").get(getUserStory);

router.route("/reply").post(replyStory);

router.route("/seen/:storyId").patch(seenStory);

router.route("/markSelfSeen").patch(markSelfSeen);

router.route("/like/:storyId").patch(likeStory);

router.route("/unlike/:storyId").patch(unlikeStory);

router.route("/new").post(upload.array("media", 5), createStory);

router.route("/delete/:storyId").delete(deleteStory);

export default router;
