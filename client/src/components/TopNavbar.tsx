import { Link } from "react-router-dom";
import logo from "/logo.svg";

export default function TopNavbar() {
  return (
    <nav className="h-15 border-b-2 border-zinc-400 dark:bg-zinc-900 bg-white text-black dark:text-white flex items-center justify-between px-4 py-4 relative z-20">
          <Link to="/" className="text-black dark:text-white flex items-center">
            <img src={logo} alt="" className="object-contain h-10" />
            <p className="font-bold tracking-tight font-inter text-inherit mx-2 text-xl">
              Sociial
            </p>
          </Link>
    </nav>
  );
}
