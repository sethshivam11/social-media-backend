import React from "react";

interface UserInterface {
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
  username: string;
  fullName: string;
  avatar: string;
}

export interface Follow {
  _id: string;
  followers: followUser[];
  followings: followUser[];
}

interface UserContext {
  user: UserInterface;
  fetchUser: Function;
  registerUser: Function;
  loginUser: Function;
  logoutUser: Function;
  verifyMail: Function;
  updatePassword: Function;
  updateAvatar: Function;
  removeAvatar: Function;
  updateDetails: Function;
  updateBlueTick: Function;
  blockUser: Function;
  unblockUser: Function;
  renewAccessToken: Function;
  isUsernameAvailable: Function;

  follow: Function;
  unfollow: Function;
  getFollowers: Function;
  getFollowing: Function;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  page: number;
}

const initialState = {
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
  fetchUser: () => {},
  registerUser: (creds: {
    fullName: string;
    username: string;
    email: string;
    password: string;
    avatar?: File;
  }) => {
    creds;
  },
  loginUser: (creds: {
    password: string;
    username?: string;
    email?: string;
  }) => {
    creds;
  },
  logoutUser: () => {},
  verifyMail: () => {},
  updatePassword: (oldPassword: string, newPassword: string) => {
    oldPassword;
    newPassword;
  },
  updateAvatar: (avatar: File) => {
    avatar;
  },
  removeAvatar: () => {},
  updateDetails: (updates: {
    fullName?: string;
    email?: string;
    username?: string;
    bio?: string;
  }) => {
    updates;
  },
  updateBlueTick: () => {},
  blockUser: (userId: string) => {
    userId;
  },
  unblockUser: (userId: string) => {
    userId;
  },
  renewAccessToken: () => {},
  isUsernameAvailable: (username: string) => {
    username;
  },

  follow: (userId: string) => {
    userId;
  },
  unfollow: (userId: string) => {
    userId;
  },
  getFollowers: (userId: string, page?: number) => {
    userId;
    page;
  },
  getFollowing: (userId: string, page?: number) => {
    userId;
    page;
  },
  page: 0,
  setPage: () => {},
};

const UserContext = React.createContext<UserContext>(initialState);

export default function UserProvider(props: React.PropsWithChildren<{}>) {
  const [user, setUser] = React.useState({
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
  });
  const [page, setPage] = React.useState(1);

  function fetchUser() {
    fetch("/api/v1/users/get")
      .then((parsed) => parsed.json())
      .then((response) => {
        if (response.success) {
          return setUser(response.data);
        }
        return response.message;
      })
      .catch((err) => {
        console.error(err);
        return "Something went wrong, while fetching data";
      });
  }

  function registerUser(creds: {
    fullName: string;
    password: string;
    username: string;
    email: string;
    avatar?: File;
  }) {
    const formData = new FormData();
    formData.append("fullName", creds.fullName);
    formData.append("username", creds.username);
    formData.append("email", creds.email);
    formData.append("password", creds.password);
    if (creds.avatar) formData.append("avatar", creds.avatar);
    fetch("/api/v1/users/register", {
      method: "POST",
      headers: {
        "Content-Type": "multipart/form-data",
      },
      body: formData,
    })
      .then((parsed) => parsed.json())
      .then((response) => {
        if (response.success) {
          return loginUser(creds);
        }
        return response.message;
      })
      .catch((err) => {
        console.error(err);
        return "Something went wrong, while fetching data";
      });
  }

  function loginUser(creds: {
    password: string;
    username?: string;
    email?: string;
  }) {
    fetch("/api/v1/users/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: creds.username,
        email: creds.email,
        password: creds.password,
      }),
    })
      .then((parsed) => parsed.json())
      .then((response) => {
        if (response.success) {
          setUser(response.data);
        }
      })
      .catch((err) => {
        console.error(err);
        return "Something went wrong, while fetching data";
      });
  }

  function logoutUser() {
    fetch("/api/v1/users/logout")
      .then((parsed) => parsed.json())
      .then((response) => {
        if (response.success) {
          return setUser({
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
          });
        }
        return response.message;
      })
      .catch((err) => {
        console.error(err);
        return "Something went wrong, while fetching data";
      });
  }

  function verifyMail() {
    fetch("/api/v1/users/verifyMail")
      .then((parsed) => parsed.json())
      .then((response) => {
        if (response.success) {
          return setUser(response.data);
        }
        return response.message;
      })
      .catch((err) => {
        console.error(err);
        return "Something went wrong, while fetching data";
      });
  }

  function updatePassword(oldPassword: string, newPassword: string) {
    fetch("/api/v1/users/changePassword", {
      method: "PATCH",
      body: JSON.stringify({
        oldPassword,
        newPassword,
      }),
    })
      .then((parsed) => parsed.json())
      .then((response) => {
        if (response.success) {
          return setUser(response.data);
        }
        return response.message;
      })
      .catch((err) => {
        console.error(err);
        return "Something went wrong, while fetching data";
      });
  }

  function updateAvatar(avatar: File) {
    const formData = new FormData();
    formData.append("avatar", avatar);
    fetch("/api/v1/users/updateAvatar", {
      method: "PATCH",
      headers: {
        "Content-Type": "Multipart/form-data",
      },
      body: formData,
    })
      .then((parsed) => parsed.json())
      .then((response) => {
        if (response.success) {
          return setUser(response.data);
        }
        return response.message;
      })
      .catch((err) => {
        console.error(err);
        return "Something went wrong, while fetching data";
      });
  }

  function removeAvatar() {
    fetch("/api/v1/users/removeAvatar")
      .then((parsed) => parsed.json())
      .then((response) => {
        if (response.success) {
          return setUser(response.data);
        }
        return response.message;
      })
      .catch((err) => {
        console.error(err);
        return "Something went wrong, while fetching data";
      });
  }

  function updateDetails(updates: {
    fullName?: string;
    username?: string;
    bio?: string;
    email?: string;
  }) {
    fetch("/api/v1/users/updateDetails", {
      method: "PUT",
      body: JSON.stringify(updates),
    })
      .then((parsed) => parsed.json())
      .then((response) => {
        if (response.success) {
          return setUser(response.data);
        }
        return response.message;
      })
      .catch((err) => {
        console.error(err);
        return "Something went wrong, while fetching data";
      });
  }

  function updateBlueTick() {
    fetch("/api/v1/users/updateBlue")
      .then((parsed) => parsed.json())
      .then((response) => {
        if (response.success) {
          return setUser(response.data);
        }
        return response.message;
      })
      .catch((err) => {
        console.error(err);
        return "Something went wrong, while fetching data";
      });
  }

  function blockUser(userId: string) {
    fetch(`/api/v1/users/block/${userId}`)
      .then((parsed) => parsed.json())
      .then((response) => {
        if (response.success) {
          return setUser(response.data);
        }
        return response.message;
      })
      .catch((err) => {
        console.error(err);
        return "Something went wrong, while fetching data";
      });
  }

  function unblockUser(userId: string) {
    fetch(`/api/v1/users/unblock/${userId}`)
      .then((parsed) => parsed.json())
      .then((response) => {
        if (response.success) {
          return setUser(response.data);
        }
        return response.message;
      })
      .catch((err) => {
        console.error(err);
        return "Something went wrong, while fetching data";
      });
  }

  function renewAccessToken() {
    fetch("/api/v1/users/renewAccessToken", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken: user.refreshToken }),
    })
      .then((parsed) => parsed.json())
      .then((response) => {
        if (response.success) {
          return setUser(response.data);
        }
        return response.message;
      })
      .catch((err) => {
        console.error(err);
        return "Something went wrong, while fetching data";
      });
  }

  function isUsernameAvailable(username: string) {
    fetch(`/api/v1/users/usernameAvailable/${username}`)
      .then((parsed) => parsed.json())
      .then((response) => {
        if (response.success) {
          return response.message;
        }
        return response.message;
      })
      .catch((err) => {
        console.error(err);
        return "Something went wrong, while fetching data";
      });
  }

  function follow(userId: string) {
    fetch(`/api/v1/users/follow/${userId}`, {
      method: "POST",
    })
      .then((parsed) => parsed.json())
      .then((response) => {
        if (response.success) {
          return setUser(response.data);
        }
        return response.message;
      })
      .catch((err) => {
        console.error(err);
        return "Something went wrong, while fetching data";
      });
  }

  function unfollow(userId: string) {
    fetch(`/api/v1/users/unfollow/${userId}`, {
      method: "POST",
    })
      .then((parsed) => parsed.json())
      .then((response) => {
        if (response.success) {
          return setUser(response.data);
        }
        return response.message;
      })
      .catch((err) => {
        console.error(err);
        return "Something went wrong, while fetching data";
      });
  }

  function getFollowers(userId: string, page?: number) {
    fetch(`/api/v1/users/getFollowers/${userId}?page=${page}`)
      .then((parsed) => parsed.json())
      .then((response) => {
        if (response.success) {
          return response.data;
        }
        return response.message;
      })
      .catch((err) => {
        console.error(err);
        return "Something went wrong, while fetching data";
      });
  }

  function getFollowing(userId: string, page?: number) {
    fetch(`/api/v1/users/getFollowing/${userId}?page=${page}`)
      .then((parsed) => parsed.json())
      .then((response) => {
        if (response.success) {
          return response.data;
        }
        return response.message;
      })
      .catch((err) => {
        console.error(err);
        return "Something went wrong, while fetching data";
      });
  }

  return (
    <UserContext.Provider
      value={{
        fetchUser,
        user,
        registerUser,
        loginUser,
        logoutUser,
        verifyMail,
        updatePassword,
        updateAvatar,
        removeAvatar,
        updateDetails,
        updateBlueTick,
        blockUser,
        unblockUser,
        renewAccessToken,
        isUsernameAvailable,
        follow,
        unfollow,
        getFollowing,
        getFollowers,
        setPage,
        page,
      }}
    >
      {props.children}
    </UserContext.Provider>
  );
}

export const useUser = () => React.useContext(UserContext);
