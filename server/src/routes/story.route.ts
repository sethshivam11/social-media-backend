import { Router } from "express";
import verifyJWT from "../middlewares/auth.middleware";
import { createStory, deleteStory, getStories, getUserStory, likeStory, seenStory, unlikeStory } from "../controllers/story.controller";
import { upload } from "../middlewares/multer.middleware";

const router = Router()

router.use(verifyJWT)


router.route("/getStories").get(getStories)

router.route("/getStory/:storyId").get(getUserStory)

router.route("/seen/:storyId").patch(seenStory)

router.route("/like/:storyId").patch(likeStory)

router.route("/unlike/:storyId").patch(unlikeStory)

router.route("/new").post(
    upload.array("media", 10),
    createStory)

router.route("/delete/:storyId").delete(deleteStory)


export default router