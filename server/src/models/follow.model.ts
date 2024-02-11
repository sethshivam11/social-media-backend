import mongoose, { Schema } from "mongoose"
import { User } from "./user.model";

export interface FollowInterface extends mongoose.Document {
    user: string,
    followers: string[];
    followings: string[];
    follow(followingId: string): void;
    unfollow(unfollowingId: string): void;
}

const followSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "user",
        required: true,
        index: true
    },
    followers: [{
        type: Schema.Types.ObjectId,
        ref: "user"
    }],
    followings: [{
        type: Schema.Types.ObjectId,
        ref: "user"
    }]
}, {
    timestamps: true
})

followSchema.methods.follow = async function (followeeId: string) {
    // update the followers for the followee
    await Follow.findOneAndUpdate({ user: followeeId },
        {
            $set: {
                $push: {
                    followers: this.user
                }
            }
        },
        { new: true })

    // increment the followersCount by 1 for followee
    await User.findByIdAndUpdate(followeeId,
        {
            $set: {
                $inc: { followersCount: 1 }
            }
        }, { new: true })

    // increment the followingCount by 1 for follower
    await User.findByIdAndUpdate(this.user,
        {
            $set: {
                $inc: { followingCount: 1 }
            }
        },
        { new: true })
}

followSchema.methods.unfollow = async function (unfolloweeId: string) {
    // update the followers for the unfollowee
    await Follow.findOneAndUpdate({ user: unfolloweeId },
        {
            $set: {
                $pop: {
                    followers: this.user
                }
            }
        },
        { new: true })

    // decrement the followersCount by 1 for unfollowee
    await User.findByIdAndUpdate(unfolloweeId,
        {
            $set: {
                $inc: { followers: -1 }
            }
        }, { new: true })

    // decrement the followingCount by 1 for unfollower
    await User.findByIdAndUpdate(this.user,
        {
            $set:
            {
                $inc: { followingCount: -1 }
            }
        }, { new: true })
}

export const Follow = mongoose.model<FollowInterface>("follow", followSchema) 