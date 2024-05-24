import { Link } from "react-router-dom";

interface Props {
  avatar: string;
  fullName: string;
  username: string;
  suggestions: {
    avatar: string;
    fullName: string;
    username: string;
    _id: string;
  }[];
}

const RightNavbar = ({ avatar, fullName, username, suggestions }: Props) => {
  return (
    <ul className="absolute right-0 w-96 top-0 h-screen flex min-[1200px] hidden max-[2000px] items-start justify-start flex-col px-16 py-6 gap-2">
      <li className="flex items-center justify-center gap-3">
        <img
          src={avatar.replace("upload", "upload/q_auto")}
          alt=""
          loading="lazy"
          className="w-8"
        />
        <div>
          <p className="font-bold">{username}</p>
          <p className="text-gray-300 text-sm">{fullName}</p>
        </div>
      </li>
      <li className="mb-4 mt-2 w-full flex justify-between text-zinc-300">Suggestions for you</li>
      {suggestions.map(({ username, avatar, fullName }, index) => (
        <li key={index} className="flex items-center justify-between w-full">
          <div className="flex items-center justify-center gap-3 text-sm">
            <img
              src={avatar.replace("upload", "upload/q_auto")}
              alt=""
              loading="lazy"
              className="w-10"
            />
            <div>
              <p className="font-bold hover:underline">
                <Link to={`/${username}`}>{username}</Link>
              </p>
              <p className="text-gray-400">
                {fullName.length > 10
                  ? `${fullName.slice(0, 10)}...`
                  : fullName}
              </p>
            </div>
          </div>
          <button className="text-blue-500 text-sm">Follow</button>
        </li>
      ))}
    </ul>
  );
};

export default RightNavbar;
