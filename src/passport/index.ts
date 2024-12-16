import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import passport from "passport";
import { User } from "../models/user.model";
import { ApiError } from "../utils/ApiError";

try {
  passport.serializeUser((user, next) => {
    next(null, user.id);
  });

  passport.deserializeUser(async (id, next) => {
    try {
      const user = await User.findById(id);
      if (user) next(null, user);
      else next(new ApiError(404, "User not found"), null);
    } catch (error) {
      next(
        new ApiError(
          500,
          "Something went wrong while deserializing the user. Error: " + error
        ),
        null
      );
    }
  });

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        callbackURL: process.env.GOOGLE_CALLBACK_URL as string,
      },
      async (_, __, profile, next) => {
        const email = profile.emails ? profile.emails[0]?.value : null;
        const fullName = profile.displayName;
        if (!email || !fullName) {
          return next(
            new ApiError(404, "Email or username is required"),
            false
          );
        }
        const user = await User.findOne({ email });
        if (user) {
          if (user.loginType !== "google") {
            throw new ApiError(
              400,
              "Please login using your username & password"
            );
          } else next(null, user);
        } else {
          const createdUser = await User.create({
            email,
            fullName,
            username: email.replace("@gmail.com", ""),
            password: email,
            isMailVerified: true,
            loginType: "google",
          });
          if (createdUser) next(null, createdUser);
          else
            next(new ApiError(500, "Error while registering the user"), false);
        }
      }
    )
  );
} catch (error) {
  console.log("Passport error", error);
}
