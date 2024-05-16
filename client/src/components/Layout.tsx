import LeftNavbar from "./LeftNavbar";
import { useUser } from "@/context/UserProvider";
import { Outlet } from "react-router-dom";

const Layout = () => {
  const { user } = useUser();
 
  return (
    <div className="min-h-screen flex items-center justify-center flex-col">
      <LeftNavbar avatar={user.avatar} />
      <Outlet />
    </div>
  );
};

export default Layout;
