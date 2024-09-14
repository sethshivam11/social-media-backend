import mongoose, { ObjectId, Schema } from "mongoose";

interface NotificationPreferencesInterface extends Document {
  user: ObjectId;
  firebaseTokens: string[];
  pushNotifications: {
    likes: boolean;
    comments: boolean;
    commentLikes: boolean;
    storyLikes: boolean;
    newFollowers: boolean;
    newMessages: boolean;
    newGroups: boolean;
  };
  emails: {
    newProducts: boolean;
    announcements: boolean;
    support: boolean;
  };
}

const NotificationPreferencesSchema: Schema<NotificationPreferencesInterface> =
  new Schema(
    {
      user: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "user",
      },
      firebaseTokens: {
        type: [String],
        default: [],
      },
      pushNotifications: {
        likes: {
          type: Boolean,
          default: true,
        },
        comments: {
          type: Boolean,
          default: true,
        },
        commentLikes: {
          type: Boolean,
          default: true,
        },
        storyLikes: {
          type: Boolean,
          default: true,
        },
        newFollowers: {
          type: Boolean,
          default: true,
        },
        newMessages: {
          type: Boolean,
          default: true,
        },
        newGroups: {
          type: Boolean,
          default: true,
        },
      },
      emails: {
        newProducts: {
          type: Boolean,
          default: true,
        },
        announcements: {
          type: Boolean,
          default: true,
        },
        support: {
          type: Boolean,
          default: true,
        },
      },
    },
    {
      timestamps: true,
    }
  );

export const NotificationPreferences =
  mongoose.model<NotificationPreferencesInterface>(
    "notificationpreferences",
    NotificationPreferencesSchema
  );
