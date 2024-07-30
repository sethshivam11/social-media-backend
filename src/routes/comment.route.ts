import { Router } from "express";
import { createComment, deleteComment, dislikeComment, getAllComments, likeComment } from "../controllers/comment.controller";
import verifyJWT from "../middlewares/auth.middleware";

const router = Router()

router.use(verifyJWT)

router.route("/get/:postId").get(getAllComments)

router.route("/new").post(createComment)

router.route("/like/:commentId").get(likeComment)

router.route("/dislike/:commentId").get(dislikeComment)

router.route("/delete/:commentId").delete(deleteComment)

export default router