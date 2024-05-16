import { Home, MessageCircleDashed, Search, SquarePlus } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "/logo.svg";

interface Props {
  avatar: string;
}

const LeftNavbar = ({ avatar }: Props) => {
  return (
    <div className="left-0 top-0 w-max px-8 h-screen fixed flex gap-20 flex-col ring-1 ring-zinc-200 dark:ring-zinc-600">
      <Link
        to="/"
        className="text-2xl flex gap-2 items-center justify-start font-extrabold tracking-tight mt-8 text-gray-200"
      >
        <img src={logo} alt="" className="w-12" />
        Sociial
      </Link>
      <ul className="flex items-center justify-center flex-col gap-8 text-xl">
        <li>
          <Link
            to="/"
            className="w-48 py-2 flex gap-2 items-center group justify-start px-4 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg"
          >
            <Home
              className={`inline group-hover:scale-110 transition-transform duration-100 ${
                location.pathname === "/" && "scale-110 font-bold"
              }`}
            />
            Home
          </Link>
        </li>
        <li>
          <Link
            to="/search"
            className="w-48 py-2 flex gap-2 items-center group justify-start px-4 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg"
          >
            <Search
              className={`inline group-hover:scale-110 transition-transform duration-100 ${
                location.pathname === "/messages" && "scale-110 font-bold"
              }`}
            />
            Search
          </Link>
        </li>
        <li>
          <Link
            to="/messages"
            className="w-48 py-2 flex gap-2 items-center group justify-start px-4 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg"
          >
            <MessageCircleDashed
              className={`inline group-hover:scale-110 transition-transform duration-100 ${
                location.pathname === "/messages" && "scale-110 font-bold"
              }`}
            />
            Messages
          </Link>
        </li>
        <li>
          <Link
            to="/create"
            className="w-48 py-2 flex gap-2 items-center group justify-start px-4 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg"
          >
            <SquarePlus
              className={`inline group-hover:scale-110 transition-transform duration-100 ${
                location.pathname === "/messages" && "scale-110 font-bold"
              }`}
            />
            Create
          </Link>
        </li>
        <li>
          <Link
            to="/profile"
            className="w-48 py-2 flex gap-2 items-center group justify-start group px-4 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg"
          >
            <img
              src={avatar.replace("upload", "upload/q_auto")}
              alt=""
              loading="lazy"
              className="object-fit-contain w-8 inline group-hover:scale-110 transition-transform duration-100"
            />
            Profile
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default LeftNavbar;
