import { Router } from "express";
import {
  getCalls,
  getCall,
  startCall,
  endCall,
  updateCall,
} from "../controllers/call.controller";
import verifyJWT from "../middlewares/auth.middleware";

const router = Router();

router.use(verifyJWT);

router.get("/", getCalls);

router.get("/get/:callId", getCall);

router.post("/start", startCall);

router.patch("/update/:callId", updateCall);

router.patch("/end/:callId", endCall);

export default router;
