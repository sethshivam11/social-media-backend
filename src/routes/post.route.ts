import { Router } from "express";
import verifyJWT from "../middlewares/auth.middleware";
import {
  createFeed,
  createPost,
  deletePost,
  dislikePost,
  explorePosts,
  getLikes,
  getPost,
  getUserPosts,
  likePost,
} from "../controllers/post.controller";
import { upload } from "../middlewares/multer.middleware";

const router = Router();

router.route("/:postId").get(getPost);

router.use(verifyJWT);

router.route("/new").post(upload.array("media", 5), createPost);

router.route("/user/:userId").get(getUserPosts);

router.route("/feed").get(createFeed);

router.route("/exploreFeed").get(explorePosts);

router.route("/like/:postId").get(likePost);

router.route("/dislike/:postId").get(dislikePost);

router.route("/delete/:postId").delete(deletePost);

router.route("/getLikes/:postId").get(getLikes);

export default router;
