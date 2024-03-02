import React from 'react';

export interface UserInterface {
    fullName: string;
    email: string;
    username: string;
    password: string;
    avatar: string;
    bio: string;
    blocked: string[];
    followingCount: number;
    followersCount: number;
    postsCount: number;
    isBlueTick: boolean;
    isMailVerified: boolean;
    refreshToken: string;
}

interface followUser {
    username: string,
    fullName: string,
    avatar: string
}

export interface Follow {
    _id: string;
    followers: followUser[],
    followings: followUser[],
}

interface UserContext {
    user: UserInterface;
    fetchUser: Function
    registerUser: Function
    loginUser: Function
    logoutUser: Function
    verifyMail: Function
    updatePassword: Function
    updateAvatar: Function
    removeAvatar: Function
    updateDetails: Function
    updateBlueTick: Function
    blockUser: Function
    unblockUser: Function
    renewAccessToken: Function
    isUsernameAvailable: Function

    follow: Function
    unfollow: Function
    getFollowers: Function
    getFollowing: Function
    setPage: React.Dispatch<React.SetStateAction<number>>
    page: number
}

export const UserContext = React.createContext<UserContext>({
    user: {
        fullName: "",
        email: "",
        username: "",
        password: "",
        avatar: "",
        bio: "",
        blocked: [],
        followingCount: 0,
        followersCount: 0,
        postsCount: 0,
        isBlueTick: false,
        isMailVerified: false,
        refreshToken: "",
    },
    fetchUser: () => { },
    registerUser: (creds: { fullName: string, username: string, email: string, password: string, avatar?: File }) => { creds },
    loginUser: (creds: { password: string, username?: string, email?: string }) => { creds },
    logoutUser: () => { },
    verifyMail: () => { },
    updatePassword: (oldPassword: string, newPassword: string) => { oldPassword; newPassword },
    updateAvatar: (avatar: File) => { avatar },
    removeAvatar: () => { },
    updateDetails: (updates: { fullName?: string, email?: string, username?: string, bio?: string }) => { updates },
    updateBlueTick: () => { },
    blockUser: (userId: string) => { userId },
    unblockUser: (userId: string) => { userId },
    renewAccessToken: () => { },
    isUsernameAvailable: (username: string) => { username },

    follow: (userId: string) => { userId },
    unfollow: (userId: string) => { userId },
    getFollowers: (userId: string, page?: number) => { userId; page },
    getFollowing: (userId: string, page?: number) => { userId; page },
    page: 0,
    setPage: () => { }
});