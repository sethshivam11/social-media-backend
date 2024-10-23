import { Router } from "express";
import verifyJWT from "../middlewares/auth.middleware";
import {
  deleteMessage,
  updateMessage,
  getMessages,
  getReacts,
  reactMessage,
  sendMessage,
  unreactMessage,
  sharePost,
} from "../controllers/message.controller";
import { upload } from "../middlewares/multer.middleware";

const router = Router();

router.use(verifyJWT);

router.route("/get").get(getMessages);

router.route("/send").post(upload.single("attachment"), sendMessage);

router.route("/sharePost").post(sharePost);

router.route("/react/:messageId").patch(reactMessage);

router.route("/unreact/:messageId").patch(unreactMessage);

router.route("/delete/:messageId").delete(deleteMessage);

router.route("/editMessage").patch(updateMessage);

router.route("/getReacts/:messageId").get(getReacts);

export default router;
