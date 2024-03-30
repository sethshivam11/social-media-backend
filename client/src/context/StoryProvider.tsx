import React from "react";

interface Story {
  _id: string;
  user: string;
  post: string;
  content: string;
  likes: string[];
  likesCount: number;
}

interface StoryContext {
  stories: Story[];
  createStory: Function;
  deleteStory: Function;
  fetchUserStories: Function;
  fetchStories: Function;
  likeStory: Function;
  dislikeStory: Function;
  seenStory: Function;
}

const initialState = {
  stories: [],
  fetchStories: (storyId: string) => {
    storyId;
  },
  fetchUserStories: (userId: string) => {
    userId;
  },
  likeStory: (storyId: string) => {
    storyId;
  },
  dislikeStory: (storyId: string) => {
    storyId;
  },
  createStory: (story: {
    captions?: string[];
    tags?: string[];
    media: File[];
  }) => {
    story;
  },
  deleteStory: (storyId: string) => {
    storyId;
  },
  seenStory: (storyId: string) => {
    storyId;
  },
};

const StoryContext = React.createContext<StoryContext>(initialState);

export default function StoryProvider (props: React.PropsWithChildren<{}>) {
  const [stories, setStories] = React.useState<Story[]>([]);

  function fetchUserStories(userId: string) {
    fetch(`/api/story/${userId}`)
      .then((parsed) => parsed.json())
      .then((response) => {
        if (response.success) {
          return setStories(response.data);
        }
        return response.message;
      })
      .catch((err) => {
        console.log(err);
        return "Something went wrong";
      });
  }

  function fetchStories() {
    fetch("/api/v1/getStories")
      .then((parsed) => parsed.json())
      .then((response) => {
        if (response.success) {
          return setStories(response.data);
        }
        return response.message;
      })
      .catch((err) => {
        console.log(err);
        return "Something went wrong";
      });
  }

  function likeStory(storyId: string) {
    fetch(`/api/v1/like/${storyId}`, {
      method: "PATCH",
    })
      .then((parsed) => parsed.json())
      .then((response) => {
        if (response.success) {
          return fetchStories();
        }
        return response.message;
      })
      .catch((err) => {
        console.log(err);
        return "Something went wrong";
      });
  }

  function dislikeStory(storyId: string) {
    fetch(`/api/v1/dislike/${storyId}`, {
      method: "PATCH",
    })
      .then((parsed) => parsed.json())
      .then((response) => {
        if (response.success) {
          return fetchStories();
        }
        return response.message;
      })
      .catch((err) => {
        console.log(err);
        return "Something went wrong";
      });
  }

  function createStory(story: {
    captions?: string[];
    tags?: string[];
    media: File[];
  }) {
    const formData = new FormData();
    if (story.captions && story.captions.length) {
      story.captions.forEach((caption) => formData.append("captions", caption));
    }
    if (story.tags && story.tags.length) {
      story.tags.forEach((tag) => formData.append("tags", tag));
    }
    story.media.forEach((media) => formData.append("media", media));
    fetch("/api/v1/new", {
      method: "POST",
      body: JSON.stringify(story),
    })
      .then((parsed) => parsed.json())
      .then((response) => {
        if (response.success) {
          return fetchStories();
        }
        return response.message;
      })
      .catch((err) => {
        console.log(err);
        return "Something went wrong";
      });
  }

  function deleteStory(storyId: string) {
    fetch(`/api/v1/delete/${storyId}`, {
      method: "DELETE",
    })
      .then((parsed) => parsed.json())
      .then((response) => {
        if (response.success) {
          return fetchStories();
        }
        return response.message;
      })
      .catch((err) => {
        console.log(err);
        return "Something went wrong";
      });
  }

  function seenStory(storyId: string) {
    fetch(`/api/v1/seen/${storyId}`, {
      method: "PATCH",
    })
      .then((parsed) => parsed.json())
      .then((response) => {
        if (response.success) {
          return fetchStories();
        }
        return response.message;
      })
      .catch((err) => {
        console.log(err);
        return "Something went wrong";
      });
  }
  return (
    <StoryContext.Provider
      value={{
        stories,
        fetchStories,
        fetchUserStories,
        likeStory,
        dislikeStory,
        createStory,
        deleteStory,
        seenStory,
      }}
    >
      {props.children}
    </StoryContext.Provider>
  );
};

export const useStory = () => React.useContext(StoryContext);
