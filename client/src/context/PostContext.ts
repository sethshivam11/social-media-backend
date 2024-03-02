import React from "react";

export interface Post {
    _id: string,
    user: string,
    caption: string,
    media: string,
    tags: string[],
    likesCount: number,
    commentsCount: number,
}

export interface Comment {
    _id: string,
    user: string,
    post: string,
    content: string,
    likes: string[],
    likesCount: number,
}

interface PostContext {
    posts: Post[],
    createPost: Function,
    deletePost: Function,
    fetchUserPosts: Function,
    fetchPost: Function,
    createFeed: Function,
    likePost: Function,
    dislikePost: Function,
    addToTags: Function,
    removeFromTags: Function,
    fetchPostComments: Function,
    commentPost: Function,
    likeComment: Function,
    dislikeComment: Function,
    deleteComment: Function,
    setPage: React.Dispatch<React.SetStateAction<number>>
}

export const PostContext = React.createContext<PostContext>({
    posts: [],
    createPost: (post: { caption: string; media: File, tags?: string }) => { post },
    deletePost: (postId: string) => { postId },
    fetchUserPosts: (userId: string) => { userId },
    fetchPost: (postId: string) => { postId },
    createFeed: () => { },
    likePost: (postId: string) => { postId },
    dislikePost: (postId: string) => { postId },
    addToTags: (postId: string, tags: string[]) => { postId; tags },
    removeFromTags: (postId: string, tags: string[]) => { postId; tags },

    fetchPostComments: (postId: string, page?: number) => { postId; page },
    commentPost: (postId: string, comment: string) => { postId; comment },
    likeComment: (commentId: string) => { commentId },
    dislikeComment: (commentId: string) => { commentId },
    deleteComment: (commentId: string) => { commentId },
    setPage: () => {}
})