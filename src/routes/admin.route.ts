import { Router } from "express";
import {
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
  usersActivity,
} from "../controllers/admin.controller";
import verifyAdmin from "../middlewares/admin.middleware";

const router = Router();

router.post("/login", login);

router.get("/logout", logout);

router.use(verifyAdmin);

router.get("/dashboard", dashboardStats);

router.get("/growth", growth);

router.get("/users", users);

router.get("/reports", reports);

router.get("/entity", getEntity);

router.get("/users-activity", usersActivity);

router.get("/content-distribution", contentDistribution);

router.delete("/reports/:reportId", deleteReport);

router.delete("/unverified-users", removeUnverifiedUsers);

export default router;
