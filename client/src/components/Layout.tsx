import LeftNavbar from "./Navbar";
import { useUser } from "@/context/UserProvider";
import { Outlet } from "react-router-dom";

const Layout = () => {
  const { user } = useUser();
 
  return (
    <div className="min-h-screen flex items-start justify-center flex-col md:ml-64 sm:ml-20">
      <LeftNavbar avatar={user.avatar} unreadMessageCount="5" newNotifications={true} />
      <Outlet />
    </div>
  );
};

export default Layout;
