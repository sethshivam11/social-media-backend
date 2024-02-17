import { Router } from "express";
import verifyJWT from "../middlewares/auth.middleware";
import { createFeed, createPost, deletePost, dislikePost, getPost, getUserPosts, likePost } from "../controllers/post.controller";
import { upload } from "../middlewares/multer.middleware";

const router = Router();

router.use(verifyJWT);

router.route("/new").post(
    upload.single("media"),
    createPost);

router.route("/user/:userId").get(getUserPosts);

router.route("/post/:postId").get(getPost);

router.route("/createFeed").get(createFeed);

router.route("/like/:postId").get(likePost);

router.route("/dislike/:postId").get(dislikePost);

router.route("/delete/:postId").delete(deletePost);

export default router;