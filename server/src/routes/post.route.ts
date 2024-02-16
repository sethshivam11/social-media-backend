import { Router } from "express";
import verifyJWT from "../middlewares/auth.middleware";
import { createPost, deletePost } from "../controllers/post.controller";
import { upload } from "../middlewares/multer.middleware";

const router = Router();

router.use(verifyJWT);

router.route("/new").post(
    upload.single("media"),
    createPost);

router.route("/delete/:postId").delete(deletePost);

export default router;