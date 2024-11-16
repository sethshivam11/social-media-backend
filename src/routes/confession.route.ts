import { Router } from "express";
import {
  deleteMessage,
  getMessages,
  sendMessage,
} from "../controllers/confession.controller";
import verifyJWT from "../middlewares/auth.middleware";
import { upload } from "../middlewares/multer.middleware";

const router = Router();

router.route("/send").post(upload.single("attachment"), sendMessage);

router.use(verifyJWT);

router.route("/get").get(getMessages);

router.route("/:messageId").delete(deleteMessage);

export default router;
