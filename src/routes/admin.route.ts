import { Router } from "express";
import {
  analytics,
  contentDistribution,
  dashboardStats,
  deleteReport,
  getEntity,
  growth,
  login,
  logout,
  removeUnverifiedUsers,
  reports,
  users,
} from "../controllers/admin.controller";
import verifyAdmin from "../middlewares/admin.middleware";

const router = Router();

router.post("/login", login);

router.get("/logout", logout);

router.get("/users", users);

router.get("/dashboard", dashboardStats);

router.get("/growth", growth);

router.get("/reports", reports);

router.get("/entity", getEntity);

router.get("/content-distribution", contentDistribution);

router.get("/analytics", analytics);

router.use(verifyAdmin);

router.delete("/reports/:reportId", deleteReport);

router.delete("/unverified-users", removeUnverifiedUsers);

export default router;
