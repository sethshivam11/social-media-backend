import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { DEFAULT_GROUP_ICON, DEFAULT_USER_AVATAR } from "../constants";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const cleanupFiles = async () => {
  const files = fs.readdirSync("./public/temp");
  files.forEach((file) => {
    if (file !== ".gitkeep") {
      fs.unlinkSync(`./public/temp/${file}`);
      console.log(file, "deleted");
    }
  });
};

const uploadToCloudinary = async (
  localFilePath: string,
  type:
    | "messages"
    | "videos"
    | "stories"
    | "posts"
    | "avatars"
    | "reports"
    | "miscellaneous"
) => {
  try {
    if (!localFilePath) return null;
    const isPost =
      type === "posts" || type === "avatars"
        ? { aspect_ratio: "1:1", crop: "crop" }
        : {};
    const isStory =
      type === "stories"
        ? { expires_at: Date.now() + 1000 * 60 * 60 * 24 }
        : {};
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder: `sociial/${type}`,
      upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET || "sociial",
      ...isPost,
      ...isStory,
    });

    fs.unlinkSync(localFilePath);

    return response;
  } catch (err) {
    console.log("Error occured while uploading to cloudinary\n", err);
    fs.unlinkSync(localFilePath);
  }
};

const deleteFromCloudinary = async (cloudFileLink: string) => {
  try {
    if (!cloudFileLink) return null;

    // do not delete if default
    if (
      cloudFileLink === DEFAULT_USER_AVATAR ||
      cloudFileLink === DEFAULT_GROUP_ICON
    ) {
      return true;
    }

    const urlArray = cloudFileLink.split("/");
    const idx = urlArray.indexOf("sociial");
    const publicId = urlArray
      .slice(idx, urlArray.length)
      .join("/")
      .split(".")[0];

    const response = await cloudinary.uploader.destroy(publicId);

    if (response?.result === "ok") return true;
  } catch (err) {
    console.log("Error occured while deleting from cloudinary\n", err);
    return false;
  }
};

export { uploadToCloudinary, deleteFromCloudinary, cleanupFiles };
