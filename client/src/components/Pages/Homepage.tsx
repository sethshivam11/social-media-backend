import { useUser } from "@/context/UserProvider";
import RightNavbar from "../RightNavbar";
import Post from "../Post";

export default function Homepage() {
  const { user } = useUser();
  const suggestions = [
    {
      username: "john_doe",
      fullName: "John Doe hwklh jkljl kdjkl jlkj lkjl",
      avatar: user.avatar,
      _id: "1",
    },
    {
      username: "john_doe",
      fullName: "John Doe",
      avatar: user.avatar,
      _id: "2",
    },
    {
      username: "john_doe",
      fullName: "John Doe",
      avatar: user.avatar,
      _id: "3",
    },
    {
      username: "john_doe",
      fullName: "John Doe",
      avatar: user.avatar,
      _id: "4",
    },
    {
      username: "john_doe",
      fullName: "John Doe",
      avatar: user.avatar,
      _id: "5",
    },
    {
      username: "john_doe",
      fullName: "John Doe",
      avatar: user.avatar,
      _id: "6",
    },
    {
      username: "john_doe",
      fullName: "John Doe",
      avatar: user.avatar,
      _id: "7",
    },
  ];
  return (
      <div className="hidden flex-row items-start justify-center w-full container lg:pr-80 h-[200vh]">
        <Post />
        <RightNavbar
          avatar={user.avatar}
          fullName={user.fullName}
          username={user.username}
          suggestions={suggestions}
        />
      </div>
  );
}
