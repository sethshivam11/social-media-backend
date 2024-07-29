import admin from "firebase-admin";

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
  }
};

export default sendNotification;
