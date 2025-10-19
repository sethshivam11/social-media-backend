import admin from "firebase-admin";
import { NotificationPreferences } from "../models/notificationpreferences.model";

interface PushNotification {
  title: string;
  body: string;
  token: string;
  image?: string;
}

const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN || "{}");

const firebaseAdmin = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const sendNotification = async ({
  token,
  title,
  body,
  image,
}: PushNotification) => {
  try {
    await firebaseAdmin.messaging().send({
      token,
      notification: {
        title,
        body,
        imageUrl: process.env.ICON_URL || image,
      },
    });
  } catch (error) {
    console.log("Error sending notification", error);

    if (
      error instanceof Error &&
      "code" in error &&
      (error.code === "messaging/invalid-registration-token" ||
        error.code === "messaging/registration-token-not-registered")
    ) {
      console.log("Invalid or expired token. Removing token:", token);

      await NotificationPreferences.findOneAndUpdate(
        { firebaseTokens: token },
        { $pull: { firebaseTokens: token } }
      );
    }
  }
};

export default sendNotification;
