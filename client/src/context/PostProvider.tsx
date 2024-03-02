import { Comment, Post, PostContext } from "./PostContext";
import React from "react";

const PostProvider = (props: React.PropsWithChildren<{}>) => {
    const [posts, setPosts] = React.useState<Post[]>([]);
    const [comments, setComments] = React.useState<Comment[]>([]);
    const [page, setPage] = React.useState(1);

    function createPost(post: { caption: string; media: File, tags?: string[] }) {
        const formData = new FormData()
        formData.append("caption", post.caption)
        formData.append("media", post.media)
        if (post.tags && post.tags.length) {
            formData.append("tags", JSON.stringify(post.tags))
        }
        fetch("/api/v1/posts/new", {
            method: "POST",
            headers: {
                "Content-Type": "multipart/form-data",
            },
            body: formData
        })
            .then(parsed => parsed.json())
            .then(response => {
                if (response.success) {
                    return setPosts([...posts, response.data])
                }
                return response.message
            })
            .catch(err => {
                console.error(err)
                console.log("Something went wrong")
            })
    }

    function createFeed() {
        fetch(`/api/v1/posts/createFeed?page=${page}`)
            .then(parsed => parsed.json())
            .then(response => {
                if (response.success) {
                    return setPosts(response.data)
                }
                return response.message
            })
            .catch(err => {
                console.error(err)
                console.log("Something went wrong")
            })
    }

    function deletePost(postId: string) {
        fetch(`/api/v1/posts/delete/${postId}`, {
            method: "DELETE"
        })
            .then(parsed => parsed.json())
            .then(response => {
                if (response.success) {
                    return setPosts(posts.filter(post => post._id !== postId))
                }
                return response.message
            })
            .catch(err => {
                console.error(err)
                console.log("Something went wrong")
            })
    }

    function fetchUserPosts(userId: string) {
        fetch(`/api/v1/posts/user/${userId}?page=${page}`)
            .then(parsed => parsed.json())
            .then(response => {
                if (response.success) {
                    return setPosts(response.data)
                }
                return response.message
            })
            .catch(err => {
                console.error(err)
                console.log("Something went wrong")
            })
    }

    function fetchPost(postId: string) {
        fetch(`/api/v1/posts/post/${postId}`)
            .then(parsed => parsed.json())
            .then(response => {
                if (response.success) {
                    return setPosts([response.data])
                }
                return response.message
            })
            .catch(err => {
                console.error(err)
                console.log("Something went wrong")
            })
    }

    function likePost(postId: string) {
        fetch(`/api/v1/posts/like/${postId}`)
            .then(parsed => parsed.json())
            .then(response => {
                if (response.success) {
                    return setPosts(posts.map(post => {
                        if (post._id === postId) {
                            post.likesCount += 1
                        }
                        return post
                    }))
                }
                return response.message
            })
            .catch(err => {
                console.error(err)
                console.log("Something went wrong")
            })
    }

    function dislikePost(postId: string) {
        fetch(`/api/v1/posts/dislike/${postId}`)
            .then(parsed => parsed.json())
            .then(response => {
                if (response.success) {
                    return setPosts(posts.map(post => {
                        if (post._id === postId) {
                            post.likesCount -= 1
                        }
                        return post
                    }))
                }
                return response.message
            })
            .catch(err => {
                console.error(err)
                console.log("Something went wrong")
            })
    }

    function addToTags(postId: string, tags: string[]) {
        fetch(`/api/v1/posts/addTags`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ postId, tags })
        })
            .then(parsed => parsed.json())
            .then(response => {
                if (response.success) {
                    return setPosts(posts.map(post => {
                        if (post._id === postId) {
                            post.tags = [...post.tags, ...tags]
                        }
                        return post
                    }))
                }
                return response.message
            })
            .catch(err => {
                console.error(err)
                console.log("Something went wrong")
            })
    }

    function removeFromTags(postId: string, tags: string[]) {
        fetch(`/api/v1/posts/removeTags`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ postId, tags })
        })
            .then(parsed => parsed.json())
            .then(response => {
                if (response.success) {
                    return setPosts(posts.map(post => {
                        if (post._id === postId) {
                            post.tags = post.tags.filter(tag => !tags.includes(tag))
                        }
                        return post
                    }))
                }
                return response.message
            })
            .catch(err => {
                console.error(err)
                console.log("Something went wrong")
            })
    }

    function fetchPostComments(postId: string, page?: number) {
        fetch(`/api/v1/comments/get/${postId}?page=${page}`)
            .then(parsed => parsed.json())
            .then(response => {
                if (response.success) {
                    return response.data
                }
                return response.message
            })
            .catch(err => {
                console.error(err)
                console.log("Something went wrong")
            })
    }

    function commentPost(postId: string, comment: string) {
        fetch(`/api/v1/comments/new`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ postId, comment })
        })
            .then(parsed => parsed.json())
            .then(response => {
                if (response.success) {
                    return setPosts(posts.map(post => {
                        if (post._id === postId) {
                            post.commentsCount += 1
                        }
                        return post
                    }))
                }
                return response.message
            })
            .catch(err => {
                console.error(err)
                console.log("Something went wrong")
            })
    }

    function likeComment(commentId: string) {
        fetch(`/api/v1/comments/like/${commentId}`)
            .then(parsed => parsed.json())
            .then(response => {
                if (response.success) {
                    return setComments(comments.map(comment => {
                        if (comment._id === commentId) {
                            comment.likesCount += 1
                        }
                        return comment
                    }))
                }
                return response.message
            })
            .catch(err => {
                console.error(err)
                console.log("Something went wrong")
            })
    }

    function dislikeComment(commentId: string) {
        fetch(`/api/v1/comments/dislike/${commentId}`)
            .then(parsed => parsed.json())
            .then(response => {
                if (response.success) {
                    return setComments(comments.map(comment => {
                        if (comment._id === commentId) {
                            comment.likesCount -= 1
                        }
                        return comment
                    }))
                }
                return response.message
            })
    }

    function deleteComment(commentId: string) {
        fetch(`/api/v1/comments/delete/${commentId}`, {
            method: "DELETE"
        })
            .then(parsed => parsed.json())
            .then(response => {
                if (response.success) {
                    return setComments(comments.filter(comment => comment._id !== commentId))
                }
                return response.message
            })
            .catch(err => {
                console.error(err)
                console.log("Something went wrong")
            })
    }

    return (
        <PostContext.Provider value={{ posts, createPost, deletePost, fetchUserPosts, fetchPost, createFeed, likePost, dislikePost, addToTags, removeFromTags, fetchPostComments, commentPost, likeComment, dislikeComment, deleteComment, setPage }}>
            {props.children}
        </PostContext.Provider>
    )
}

export default PostProvider
export const usePost = () => React.useContext(PostContext)