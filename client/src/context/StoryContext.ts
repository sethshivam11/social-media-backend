import React from "react"

export interface Story {
    _id: string,
    user: string,
    post: string,
    content: string,
    likes: string[],
    likesCount: number,
}

interface StoryContext {
    stories: Story[],
    createStory: Function,
    deleteStory: Function,
    fetchUserStories: Function,
    fetchStories: Function,
    likeStory: Function,
    dislikeStory: Function,
    seenStory: Function,
}

const StoryContext = React.createContext<StoryContext>({
    stories: [],
    fetchStories: (storyId: string) => { storyId },
    fetchUserStories: (userId: string) => { userId },
    likeStory: (storyId: string) => { storyId },
    dislikeStory: (storyId: string) => { storyId },
    createStory: (story: { captions?: string[], tags?: string[], media: File[] }) => { story },
    deleteStory: (storyId: string) => { storyId },
    seenStory: (storyId: string) => { storyId }
})

export default StoryContext