import { Router } from "express";
import {
  analytics,
  contentDistribution,
  dashboardStats,
  deleteReport,
  getEntity,
  getMessages,
  growth,
  login,
  logout,
  messageAnalytics,
  removeUnverifiedUsers,
  reportAnalytics,
  reports,
  reportsOverview,
  updateReport,
  users,
  userStats,
} from "../controllers/admin.controller";
import verifyAdmin from "../middlewares/admin.middleware";

const router = Router();

router.post("/login", login);

router.get("/logout", logout);

router.get("/users", users);

router.get("/dashboard", dashboardStats);

router.get("/user-stats", userStats);

router.get("/growth", growth);

router.get("/reports", reports);

router.get("/entity", getEntity);

router.get("/messages/:id", getMessages);

router.get("/content-distribution", contentDistribution);

router.get("/analytics", analytics);

router.get("/report-analytics", reportAnalytics);

router.get("/reports-overview", reportsOverview);

router.get("/message-analytics", messageAnalytics);

router.use(verifyAdmin);

router.put("/reports/:id", updateReport);

router.delete("/reports/:reportId", deleteReport);

router.delete("/unverified-users", removeUnverifiedUsers);

export default router;
