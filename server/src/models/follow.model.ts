import mongoose, { Document, ObjectId, Schema } from "mongoose";
import { User } from "./user.model";

export interface FollowInterface extends Document {
  user: ObjectId;
  followers: ObjectId[];
  followings: ObjectId[];
  follow(followingId: ObjectId): Promise<void>;
  unfollow(unfollowingId: ObjectId): Promise<void>;
}

const followSchema: Schema<FollowInterface> = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    followers: [
      {
        type: Schema.Types.ObjectId,
        ref: "user",
        required: true,
      },
    ],
    followings: [
      {
        type: Schema.Types.ObjectId,
        ref: "user",
        required: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

followSchema.methods.follow = async function (followeeId: ObjectId) {
  // update the followers for the followee
  await Follow.findOneAndUpdate(
    { user: followeeId },
    {
      $push: { followers: this.user },
    },
    { new: true }
  );

  // increment the followersCount by 1 for followee
  await User.findByIdAndUpdate(
    followeeId,
    {
      $inc: { followersCount: 1 },
    },
    { new: true }
  );

  // increment the followingCount by 1 for follower
  await User.findByIdAndUpdate(
    this.user,
    {
      $inc: { followingCount: 1 },
    },
    { new: true }
  );
};

followSchema.methods.unfollow = async function (unfolloweeId: ObjectId) {
  // update the followers for the unfollowee
  await Follow.findOneAndUpdate(
    { user: unfolloweeId },
    {
      $pull: { followers: this.user },
    },
    { new: true }
  );

  // decrement the followersCount by 1 for unfollowee
  await User.findByIdAndUpdate(
    unfolloweeId,
    {
      $inc: { followersCount: -1 },
    },
    { new: true }
  );

  // decrement the followingCount by 1 for unfollower
  await User.findByIdAndUpdate(
    this.user,
    {
      $inc: { followingCount: -1 },
    },
    { new: true }
  );
};

export const Follow = mongoose.model<FollowInterface>("follow", followSchema);
