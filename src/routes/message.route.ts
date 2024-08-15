import { Router } from "express";
import verifyJWT from "../middlewares/auth.middleware";
import {
  deleteMessage,
  editMessageContent,
  getMessages,
  reactMessage,
  sendMessage,
  unreactMessage,
} from "../controllers/message.controller";
import { upload } from "../middlewares/multer.middleware";

const router = Router();

router.use(verifyJWT);

router.route("/get").get(getMessages);

router.route("/send").post(upload.single("attachment"), sendMessage);

router.route("/react").patch(reactMessage);

router.route("/unreact").patch(unreactMessage);

router.route("/delete/:messageId").delete(deleteMessage);

router.route("/editMessage").patch(editMessageContent);

export default router;
