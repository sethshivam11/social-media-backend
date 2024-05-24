import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  SendHorizonal,
} from "lucide-react";

function Post() {
  return (
    <div className="bg-zinc-800 w-[30rem] px-6 py-4 rounded-xl">
      <div className="flex justify-between">
        <div className="flex justify-start w-full items-center gap-3">
          <img
            src=""
            alt=""
            className="w-10 object-contain"
          />
          <div className="flex flex-col leading-5">
            <span>Shivam</span>
            <span className="text-zinc-500 text-sm font-medium">
              &#64;_seth_shivam
            </span>
          </div>
        </div>
        <MoreHorizontal
          strokeWidth={1.5}
          className="text-zinc-200 cursor-pointer"
        />
      </div>
      <div className="min-h-80">
        <img
          src=""
          className="contain rounded-md pt-4 select-none"
          alt=""
        />
      </div>
      <div className="flex gap-3 mt-4">
        <Heart
          strokeWidth={1.5}
          className="active:scale-110 cursor-pointer"
          onClick={(e) => {
            const currentColor = (e.target as HTMLElement).getAttribute("fill");
            console.log(currentColor);
            if (currentColor != "#f45571") {
              (e.target as HTMLElement).setAttribute("stroke-width", "0");
              (e.target as HTMLElement).setAttribute("fill", "#f45571");
            } else {
              (e.target as HTMLElement).setAttribute("stroke-width", "1.5");
              (e.target as HTMLElement).setAttribute("fill", "");
            }
          }}
        />
        <MessageCircle strokeWidth={1.5} className="cursor-pointer" />
        <SendHorizonal strokeWidth={1.5} className="cursor-pointer" />
      </div>
      <p className="text-xs mt-2 text-zinc-400 font-sans">
        Liked by iamshanks_ and 1 other
      </p>
      <p className="text-sm mt-2 text-zinc-200">
        <span className="font-bold">Shivam&nbsp;</span>
        How does such officer live knowing they occured up a murder
      </p>
    </div>
  );
}

export default Post;
