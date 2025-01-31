import { Router, Request } from "express";
import passport from "passport";
import { handleSocialLogin } from "../controllers/user.controller";

const router = Router();

router.route("/auth/google").get(
  passport.authenticate("google", {
    scope: ["profile", "email"],
  }),
  (_, res) => {
    res.send("Google Auth");
  }
);

router.route("/auth/google/callback").get(
  passport.authenticate("google", {
    failureRedirect: "/auth/google/failure",
    failureMessage: true,
  }),
  handleSocialLogin
);

router
  .route("/auth/google/failure")
  .get((req: Request & { session: { messages?: string[] } }, res) => {
    const message =
      req.session?.messages?.[0] || "Google Authentication failed";
    res.redirect(
      `${
        process.env.CLIENT_SSO_REDIRECT_URL
      }/sign-in?message=${encodeURIComponent(message)}`
    );
  });

export default router;
