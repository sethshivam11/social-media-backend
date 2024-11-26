import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import passport, { DoneCallback } from "passport";
import { User } from "../models/user.model";
import { ApiError } from "../utils/ApiError";

try {
  passport.serializeUser((user, next) => {
    next(null, user._id);
  });

  passport.deserializeUser(async (id, next) => {
    try {
      const user = await User.findById(id);
      if (user) next(null, user);
      else
        next(
          {
            status: 404,
            message: "User not found",
          },
          null
        );
    } catch (error) {
      next(error, null);
    }
  });

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        callbackURL: process.env.GOOGLE_CALLBACK_URL as string,
      },
      async (_: string, __: string, profile: Profile, next: DoneCallback) => {
        const email = profile.emails ? profile.emails[0]?.value : null;
        const fullName = profile.displayName;
        if (!email || !fullName) {
          return next(new ApiError(404, "Email or name does not exists"), null);
        }
        const user = await User.findOne({ fullName });
        if (user) {
          next(null, user);
        } else {
          const createdUser = await User.create({
            email,
            fullName,
            username: email.replace("@gmail.com", ""),
          });
          if (createdUser) next(null, createdUser);
          else
            next(
              {
                status: 400,
                message: "User not created",
              },
              null
            );
        }
      }
    )
  );
} catch (error) {
  console.log("Passport error", error);
}
