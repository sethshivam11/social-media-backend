import { useUser } from "@/context/UserProvider";
import RightNavbar from "../RightNavbar";

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
    <>
      <div className="animate-pulse md:text-5xl sm:text-4xl text-2xl grid place-items-center h-screen">
        App is under development
      </div>
      <RightNavbar
        avatar={user.avatar}
        fullName={user.fullName}
        username={user.username}
        suggestions={suggestions}
      />
    </>
  );
}
