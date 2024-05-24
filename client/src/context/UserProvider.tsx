import React from "react";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

interface UserInterface {
  fullName: string;
  email: string;
  username: string;
  password: string;
  avatar: string;
  bio: string;
  blocked: FollowUser[];
  followingCount: number;
  followersCount: number;
  postsCount: number;
  isBlueTick: boolean;
  isMailVerified: boolean;
}

interface followUser {
  username: string;
  fullName: string;
  avatar: string;
}

// interface Follow {
//   _id: string;
//   followers: followUser[];
//   followings: followUser[];
// }

interface FollowUser {
  _id: string;
  avatar: string;
  fullName: string;
  username: string;
}

interface Profile {
  _id: string;
  fullName: string;
  username: string;
  avatar: string;
  bio: string;
  followers: number;
  following: number;
  postsCount: number;
  isBlueTick: boolean;
}

interface UserContext {
  user: UserInterface;
  loading: boolean;
  setLoading: Function;
  followers: FollowUser[];
  following: followUser[];
  setFollowers: Function;
  setFollowing: Function;
  getProfile: Function;
  profile: Profile;
  setProfile: Function;
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

  isLoggedIn: boolean;
  setIsLoggedIn: Function;
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
  },
  profile: {
    _id: "",
    fullName: "",
    username: "",
    avatar: "",
    bio: "",
    followers: 0,
    following: 0,
    postsCount: 0,
    isBlueTick: false,
  },
  setProfile: () => {},
  getProfile: () => {},
  followers: [],
  following: [],
  setFollowers: () => {},
  setFollowing: () => {},
  loading: false,
  setLoading: () => {},
  isLoggedIn: false,
  setIsLoggedIn: () => {},
  fetchUser: () => {},
  registerUser: () => {},
  loginUser: () => {},
  logoutUser: () => {},
  verifyMail: () => {},
  updatePassword: () => {},
  updateAvatar: () => {},
  removeAvatar: () => {},
  updateDetails: () => {},
  updateBlueTick: () => {},
  blockUser: () => {},
  unblockUser: () => {},
  renewAccessToken: () => {},
  follow: () => {},
  unfollow: () => {},
  getFollowers: () => {},
  getFollowing: () => {},
  page: 0,
  setPage: () => {},
};

const UserContext = React.createContext<UserContext>(initialState);

export default function UserProvider(props: React.PropsWithChildren<{}>) {
  const navigate = useNavigate();

  const storage = {
    refreshToken: "sociial-refreshToken",
    accessToken: "sociial-accessToken",
  };

  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [followers, setFollowers] = React.useState<FollowUser[]>([]);
  const [following, setFollowing] = React.useState<FollowUser[]>([]);
  const [user, setUser] = React.useState<UserInterface>(initialState.user);
  const [profile, setProfile] = React.useState<Profile>(initialState.profile);

  function fetchUser() {
    setLoading(true);
    fetch("/api/v1/users/get", {
      headers: {
        "Content-Type": "application/json",
        // Authorization: `Bearer ${localStorage.getItem(storage.accessToken)}`,
      },
    })
      .then((parsed) => parsed.json())
      .then((response) => {
        if (response.success) {
          setUser(response.data);
        }
      })
      .catch(async (err) => {
        console.error(err);
        if (err.message === "Token expired!") {
          await renewAccessToken();
        }
      })
      .finally(() => setLoading(false));
  }

  function registerUser(creds: {
    fullName: string;
    password: string;
    username: string;
    email: string;
    avatar?: File;
  }) {
    setLoading(true);
    const formData = new FormData();
    formData.append("fullName", creds.fullName);
    formData.append("username", creds.username);
    formData.append("email", creds.email);
    formData.append("password", creds.password);
    if (creds.avatar) formData.append("avatar", creds.avatar);
    fetch("/api/v1/users/register", {
      method: "POST",
      body: formData,
    })
      .then((parsed) => parsed.json())
      .then((response) => {
        if (response.success) {
          toast({
            title: "Success",
            description: response.message,
          });
          const username = response.data.username;
          navigate(`/verify?username=${username}`);
        } else {
          toast({
            title: "Error",
            description: response.message || "Something went wrong!",
          });
        }
      })
      .catch((err) => {
        console.error(err);
        toast({
          title: "Error",
          description: err.message || "Something went wrong!",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }

  function loginUser(creds: {
    password: string;
    username?: string;
    email?: string;
  }) {
    if (!(creds.username || creds.email))
      return console.log("Either username or email is required");
    setLoading(true);
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
          setUser(response.data.user);
          localStorage.setItem(storage.accessToken, response.data.accessToken);
          localStorage.setItem(
            storage.refreshToken,
            response.data.refreshToken
          );
          setIsLoggedIn(true);
          if (!response.data.user.isMailVerified) {
            navigate("/verify");
          } else {
            navigate("/");
          }
        }
      })
      .catch((err) => {
        console.error(err);
        toast({
          title: "Error",
          description: err.message || "Something went wrong!",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }

  function logoutUser() {
    setLoading(true);
    fetch("/api/v1/users/logout")
      .then((parsed) => parsed.json())
      .then((response) => {
        if (response.success) {
          setUser(initialState.user);
          setIsLoggedIn(false);
          localStorage.removeItem(storage.accessToken);
          localStorage.removeItem(storage.refreshToken);
          toast({
            title: "Success",
            description: response.message,
          });
          navigate("/sign-in");
        }
      })
      .catch(async (err) => {
        console.error(err);
        toast({
          title: "Error",
          description: err.message || "Something went wrong!",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }

  function verifyMail({ username, code }: { username: string; code: string }) {
    setLoading(true);
    fetch(`/api/v1/users/verify?code=${code}&username=${username}`, {
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((parsed) => parsed.json())
      .then((response) => {
        if (response.success) {
          setUser({
            ...user,
            isMailVerified: true,
          });
          toast({
            title: "Success",
            description: response.message,
          });
          navigate("/");
        }
      })
      .catch(async (err) => {
        console.error(err);
        if (err.message === "Token expired!") {
          await renewAccessToken();
        }
        toast({
          title: "Error",
          description: err.message || "Something went wrong!",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }

  function updatePassword(oldPassword: string, newPassword: string) {
    setLoading(true);
    fetch("/api/v1/users/changePassword", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        // Authorization: `Bearer ${localStorage.getItem(storage.accessToken)}`,
      },
      body: JSON.stringify({
        oldPassword,
        newPassword,
      }),
    })
      .then((parsed) => parsed.json())
      .then((response) => {
        if (response.success) {
          toast({
            title: "Success",
            description: response.message,
          });
        }
      })
      .catch(async (err) => {
        if (err.message === "Token expired!") {
          await renewAccessToken();
        }
        console.error(err);
        toast({
          title: "Error",
          description: err.message || "Something went wrong!",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }

  function updateAvatar(avatar: File) {
    setLoading(true);
    const formData = new FormData();
    formData.append("avatar", avatar);
    fetch("/api/v1/users/updateAvatar", {
      method: "PATCH",
      headers: {
        "Content-Type": "multipart/form-data",
        // Authorization: `Bearer ${localStorage.getItem(storage.accessToken)}`,
      },
      body: formData,
    })
      .then((parsed) => parsed.json())
      .then((response) => {
        if (response.success) {
          setUser({
            ...user,
            avatar: response.data.avatar,
          });
          toast({
            title: "Success",
            description: response.message,
          });
        }
      })
      .catch(async (err) => {
        console.error(err);
        if (err.message === "Token expired!") {
          await renewAccessToken();
        }
        toast({
          title: "Error",
          description: err.message || "Something went wrong!",
        });
      })
      .finally(() => setLoading(false));
  }

  function removeAvatar() {
    setLoading(true);
    fetch("/api/v1/users/removeAvatar", {
      headers: {
        "Content-Type": "application/json",
        // Authorization: `Bearer ${localStorage.getItem(storage.accessToken)}`,
      },
    })
      .then((parsed) => parsed.json())
      .then((response) => {
        if (response.success) {
          setUser({
            ...user,
            avatar: response.data.avatar,
          });
          toast({
            title: "Success",
            description: response.message,
          });
        }
      })
      .catch(async (err) => {
        console.error(err);
        if (err.message === "Token expired!") {
          await renewAccessToken();
        }
        toast({
          title: "Error",
          description: err.message || "Something went wrong!",
        });
      })
      .finally(() => setLoading(false));
  }

  function updateDetails(updates: {
    fullName?: string;
    username?: string;
    bio?: string;
    email?: string;
  }) {
    if (!(updates.fullName || updates.bio || updates.email || updates.username))
      return console.log("Atleast one update is required");
    setLoading(true);
    fetch("/api/v1/users/updateDetails", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        // Authorization: `Bearer ${localStorage.getItem(storage.accessToken)}`,
      },
      body: JSON.stringify(updates),
    })
      .then((parsed) => parsed.json())
      .then((response) => {
        if (response.success) {
          toast({
            title: "Success",
            description: response.message,
          });
          setUser({
            ...user,
            fullName: response.data.fullName,
            bio: response.data.bio,
            email: response.data.email,
            username: response.data.username,
          });
        }
      })
      .catch(async (err) => {
        console.error(err);
        if (err.message === "Token expired!") {
          await renewAccessToken();
        }
        toast({
          title: "Error",
          description: err.message || "Something went wrong!",
        });
      })
      .finally(() => setLoading(false));
  }

  function updateBlueTick() {
    setLoading(true);
    fetch("/api/v1/users/updateBlue", {
      headers: {
        "Content-Type": "application/json",
        // Authorization: `Bearer ${localStorage.getItem(storage.accessToken)}`,
      },
    })
      .then((parsed) => parsed.json())
      .then((response) => {
        if (response.success) {
          toast({
            title: "Success",
            description: response.message,
          });
          setUser({
            ...user,
            isBlueTick: response.data.isBlueTick,
          });
        }
      })
      .catch(async (err) => {
        console.error(err);
        if (err.message === "Token expired!") {
          await renewAccessToken();
        }
        toast({
          title: "Error",
          description: err.message || "Something went wrong!",
        });
      })
      .finally(() => setLoading(false));
  }

  function blockUser(userToBeBlocked: FollowUser) {
    setLoading(true);
    fetch(`/api/v1/users/block/${userToBeBlocked._id}`, {
      headers: {
        "Content-Type": "application/json",
        // Authorization: `Bearer ${localStorage.getItem(storage.accessToken)}`,
      },
    })
      .then((parsed) => parsed.json())
      .then((response) => {
        if (response.success) {
          setUser({
            ...user,
            blocked: [...user.blocked, userToBeBlocked],
          });
          toast({
            title: "Success",
            description: response.message,
          });
        }
      })
      .catch(async (err) => {
        console.error(err);
        if (err.message === "Token expired!") {
          await renewAccessToken();
        }
        toast({
          title: "Error",
          description: err.message || "Something went wrong!",
        });
      })
      .finally(() => setLoading(false));
  }

  function unblockUser(userToBeUnblocked: FollowUser) {
    setLoading(true);
    fetch(`/api/v1/users/unblock/${userToBeUnblocked._id}`, {
      headers: {
        "Content-Type": "application/json",
        // Authorization: `Bearer ${localStorage.getItem(storage.accessToken)}`,
      },
    })
      .then((parsed) => parsed.json())
      .then((response) => {
        if (response.success) {
          const filteredUsers = user.blocked.filter(
            (blocked) => blocked._id !== userToBeUnblocked._id
          );
          setUser({
            ...user,
            blocked: filteredUsers,
          });
          toast({
            title: "Success",
            description: response.message,
          });
        }
      })
      .catch(async (err) => {
        console.error(err);
        if (err.message === "Token expired!") {
          await renewAccessToken();
        }
        toast({
          title: "Error",
          description: err.message || "Something went wrong!",
        });
      })
      .finally(() => setLoading(false));
  }

  function renewAccessToken() {
    setLoading(true);
    fetch("/api/v1/users/renewAccessToken", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refreshToken: localStorage.getItem(storage.accessToken),
      }),
    })
      .then((parsed) => parsed.json())
      .then((response) => {
        if (response.success) {
          localStorage.removeItem(storage.accessToken);
          localStorage.setItem(storage.accessToken, response.data.accessToken);
        }
      })
      .catch((err) => {
        console.error(err);
        navigate("/sign-in");
        toast({
          title: "Please login again",
        });
      })
      .finally(() => setLoading(false));
  }

  function follow(user: FollowUser) {
    setLoading(true);
    fetch(`/api/v1/users/follow/${user._id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Authorization: `Bearer ${localStorage.getItem(storage.accessToken)}`,
      },
    })
      .then((parsed) => parsed.json())
      .then((response) => {
        if (response.success) {
          setFollowing([...following, user]);
        }
      })
      .catch(async (err) => {
        console.error(err);
        if (err.message === "Token expired!") {
          await renewAccessToken();
        }
        toast({
          title: "Error",
          description: err.message || "Error following the user",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }

  function unfollow(user: FollowUser) {
    setLoading(true);
    fetch(`/api/v1/users/unfollow/${user._id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Authorization: `Bearer ${localStorage.getItem(storage.accessToken)}`,
      },
    })
      .then((parsed) => parsed.json())
      .then((response) => {
        if (response.success) {
          setFollowing(following.filter((follow) => follow._id !== user._id));
        }
      })
      .catch(async (err) => {
        console.error(err);
        if (err.message === "Token expired!") {
          await renewAccessToken();
        }
        toast({
          title: "Error",
          description: err.message || "Error unfollowing the user",
          variant: "destructive",
        });
        return "Something went wrong!";
      })
      .finally(() => setLoading(false));
  }

  function getFollowers(userId: string, page?: number) {
    fetch(`/api/v1/users/getFollowers/${userId}?page=${page}`)
      .then((parsed) => parsed.json())
      .then((response) => {
        if (response.success) {
          setFollowers(response.data);
        }
      })
      .catch(async (err) => {
        console.error(err);
        if (err.message === "Token expired!") {
          await renewAccessToken();
        }
      });
  }

  function getFollowing(userId: string, page?: number) {
    fetch(`/api/v1/users/getFollowing/${userId}?page=${page}`)
      .then((parsed) => parsed.json())
      .then((response) => {
        if (response.success) {
          setFollowing(response.data);
        }
      })
      .catch(async (err) => {
        console.error(err);
        if (err.message === "Token expired!") {
          await renewAccessToken();
        }
      });
  }

  function getProfile({
    username,
    userId,
  }: {
    username?: string;
    userId?: string;
  }) {
    setLoading(true);
    fetch(`/api/v1/users/getProfile/?username=${username}&userId=${userId}`)
      .then((parsed) => parsed.json())
      .then((response) => {
        if (response.success) {
          setProfile(response.data);
        } else {
          toast({
            title: "Error",
            description: response.message,
          });
        }
      })
      .catch(async (err) => {
        console.error(err);
        if (err.message === "Token expired!") {
          await renewAccessToken();
        }
        toast({
          title: "Error",
          description: err.message || "Something went wrong!",
        });
      })
      .finally(() => setLoading(false));
  }

  React.useEffect(() => {
    if (localStorage.getItem(storage.accessToken)) {
      setIsLoggedIn(true);
      window.document.cookie = `accessToken=${localStorage.getItem(
        storage.accessToken
      )};`;
      document.cookie = `refreshToken=${localStorage.getItem(
        storage.refreshToken
      )};`;
      fetchUser();
    }
  }, []);

  return (
    <UserContext.Provider
      value={{
        fetchUser,
        user,
        profile,
        setProfile,
        followers,
        following,
        getProfile,
        setFollowers,
        setFollowing,
        loading,
        setLoading,
        isLoggedIn,
        setIsLoggedIn,
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
