import {
  AlignJustify,
  CirclePlus,
  Heart,
  Home,
  MessageSquareMore,
  Moon,
  Search,
  Settings,
  Sun,
} from "lucide-react";
import { Link } from "react-router-dom";
import logo from "/logo.svg";
import { useTheme } from "@/context/ThemeProvider";
// import { useUser } from "@/context/UserProvider";
import React from "react";

interface Props {
  avatar: string;
  unreadMessageCount: string;
  newNotifications: boolean;
}

const Navbar = ({ avatar, unreadMessageCount, newNotifications }: Props) => {
  const {
    theme,
    // setTheme
  } = useTheme();
  // const { logoutUser } = useUser();
  // const navigate = useNavigate();
  const moreBtn = React.useRef() as React.MutableRefObject<HTMLUListElement>;

  return (
    <nav className="left-0 sm:top-0 bottom-0 py-3 sm:py-0 sm:w-max w-full md:px-8 px-1 sm:h-screen fixed flex justify-evenly sm:items-center gap-20 flex-col ring-1 ring-zinc-200 dark:ring-zinc-600 z-20 bg-white dark:bg-black">
      <Link
        to="/"
        className="text-2xl sm:flex hidden gap-4 md:justify-start justify-center font-extrabold tracking-tight mt-8 dark:text-gray-200"
      >
        <img src={logo} alt="" className="w-12" />
        <span className="hidden md:inline">Sociial</span>
      </Link>
      <ul className="flex items-center sm:justify-center justify-between sm:px-2 px-6 sm:flex-col sm:gap-8 text-lg">
        <li>
          <Link
            to="/"
            className={`md:w-48 w-fit py-2 flex gap-4 items-center group justify-start px-4 sm:hover:bg-zinc-200 sm:dark:hover:bg-zinc-800 rounded-lg ${
              location.pathname === "/" && "font-bold"
            }`}
          >
            <Home
              className={`inline sm:group-hover:scale-110 sm:group-active:scale-100 transition-transform duration-100 ${
                location.pathname === "/" && "sm:scale-110 font-bold"
              }`}
            />
            <span className="hidden md:inline">Home</span>
          </Link>
        </li>
        <li>
          <Link
            to="/search"
            className={`md:w-48 w-fit py-2 flex gap-4 items-center group justify-start px-4 sm:hover:bg-zinc-200 sm:dark:hover:bg-zinc-800 rounded-lg ${
              location.pathname === "/search" && "font-bold"
            }`}
          >
            <Search
              className={`inline sm:group-hover:scale-110  sm:group-active:scale-100 transition-transform duration-100 ${
                location.pathname === "/search" && "sm:scale-110 font-bold"
              }`}
            />
            <span className="hidden md:inline">Search</span>
          </Link>
        </li>
        <li>
          <Link
            to="/messages"
            className={`md:w-48 w-fit py-2 flex gap-4 items-center group justify-start px-3.5 sm:hover:bg-zinc-200 sm:dark:hover:bg-zinc-800 rounded-lg ${
              location.pathname === "/messages" && "font-bold"
            }`}
          >
            <span className="relative inline-block">
              <MessageSquareMore
                className={`inline sm:group-hover:scale-110 sm:group-active:scale-100 transition-transform duration-100 ${
                  location.pathname === "/messages" && "sm:scale-110 font-bold"
                }`}
              />

              {unreadMessageCount !== "0" && (
                <div className="absolute inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-500 border-2 border-white rounded-full -top-2 -end-2 dark:border-gray-900">
                  {unreadMessageCount}
                </div>
              )}
            </span>

            <span className="hidden md:inline">Messages</span>
          </Link>
        </li>
        <li className="sm:inline-block hidden">
          <div className="md:w-48 w-fit py-2 flex gap-4 items-center group justify-start px-4 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg cursor-pointer">
            <span className="inline-block relative">
              <Heart
                className={`inline group-hover:scale-110 group-active:scale-100 transition-transform duration-100`}
              />
              {newNotifications && (
                <span className="absolute top-0 right-0 inline-block w-2.5 h-2.5 transform translate-x-1/3 translate-y-0.5 bg-red-600 rounded-full"></span>
              )}
            </span>
            <span className="hidden md:inline">Notifications</span>
          </div>
        </li>
        <li  className="sm:inline-block hidden">
          <Link
            to="/create"
            className={`md:w-48 w-fit py-2 flex gap-4 items-center group justify-start px-4 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg ${
              location.pathname === "/create" && "font-bold"
            }`}
          >
            <CirclePlus
              className={`inline group-hover:scale-110 group-active:scale-100 transition-transform duration-100 ${
                location.pathname === "/create" && "scale-110 font-bold"
              }`}
            />
            <span className="hidden md:inline">Create</span>
          </Link>
        </li>
        <li>
          <Link
            to="/profile"
            className={`md:w-48 w-max py-2 flex gap-2 items-center group justify-start group px-4 sm:hover:bg-zinc-200 sm:dark:hover:bg-zinc-800 rounded-lg ${
              location.pathname === "/profile" && "sm:group-hover:scale-110 font-bold"
            }`}
          >
            <img
              src={avatar.replace("upload", "upload/q_auto")}
              alt=""
              loading="eager"
              className={`object-fit-contain w-8 inline group-hover:scale-110 group-active:scale-100 transition-transform duration-100 ${
                location.pathname === "/" && "scale-110 font-bold"
              }`}
            />
            <span className="hidden md:inline">Profile</span>
          </Link>
        </li>
      </ul>
      <button className="md:w-48 w-fit py-2 sm:flex hidden gap-2 items-center group justify-start group px-4 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg cursor-pointer border-0">
        <AlignJustify className="inline group-hover:scale-110 group-active:scale-100 transition-transform duration-100" />
        <span className="hidden md:inline">More</span>
      </button>
      <ul
        className="peer-hover:flex flex-col hidden bottom-[5rem] left-10 absolute rounded-lg p-1 bg-zinc-800"
        ref={moreBtn}
      >
        <li>
          <Link
            to="/settings"
            className="md:w-48 w-fit py-2 flex gap-2 peer items-center group justify-start group px-4 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg cursor-pointer border-0"
          >
            <Settings className="inline group-hover:scale-110 group-active:scale-100 transition-transform duration-100" />
            Settings
          </Link>
        </li>
        <li>
          <button className="md:w-48 w-fit py-2 flex gap-2 peer items-center group justify-start group px-4 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg cursor-pointer border-0">
            {theme === "dark" ? (
              <Moon className="inline" />
            ) : (
              <Sun className="inline" />
            )}
            Switch Theme
          </button>
        </li>

        <li>
          <button className="md:w-48 w-fit py-2 flex gap-2 peer items-center group justify-start group px-4 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg cursor-pointer border-0">
            Logout
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
