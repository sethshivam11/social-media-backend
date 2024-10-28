import { Router } from "express";
import {
  getCalls,
  getCall,
  startCall,
  endCall,
  acceptCall,
} from "../controllers/call.controller";
import verifyJWT from "../middlewares/auth.middleware";

const router = Router();

router.use(verifyJWT);

router.get("/", getCalls);

router.get("/:callId", getCall);

router.post("/start", startCall);

router.patch("/accept/:callId", acceptCall);

router.patch("/end/:callId", endCall);

export default router;
