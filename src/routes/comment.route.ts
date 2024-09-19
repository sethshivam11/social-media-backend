import { Router } from "express";
import {
  createComment,
  deleteComment,
  unlikeComment,
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

router.route("/unlike/:commentId").get(unlikeComment);

router.route("/delete/:commentId").delete(deleteComment);

export default router;
