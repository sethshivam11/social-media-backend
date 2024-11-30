import { Router } from "express";
import passport from "passport";
import { handleSocialLogin } from "../controllers/user.controller";

const router = Router();

router.route("/auth/google").get(
  passport.authenticate("google", {
    scope: ["profile", "email"],
  }),
  (req, res) => {
    res.send("Google Auth");
  }
);

router
  .route("/auth/google/callback")
  .get(
    passport.authenticate("google", { failureRedirect: "/sign-in" }),
    handleSocialLogin
  );

export default router;
