import { Router } from "express";
import {
  createComment,
  deleteComment,
  dislikeComment,
  getAllComments,
  getCommentLikes,
  likeComment,
} from "../controllers/comment.controller";
import verifyJWT from "../middlewares/auth.middleware";

const router = Router();

router.route("/:postId").get(getAllComments);

router.route("/likes/:commentId").get(getCommentLikes);

router.use(verifyJWT);

router.route("/new").post(createComment);

router.route("/like/:commentId").get(likeComment);

router.route("/dislike/:commentId").get(dislikeComment);

router.route("/delete/:commentId").delete(deleteComment);

export default router;
