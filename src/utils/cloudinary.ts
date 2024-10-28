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

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder: `sociial/${type}`,
      upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET || "sociial",
      ...isPost,
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

    let publicId = urlArray.slice(idx, urlArray.length).join("/").split(".")[0];
    let resource_type: "raw" | "video" | undefined = undefined;
    if (cloudFileLink.includes("raw")) {
      publicId = urlArray.slice(idx, urlArray.length).join("/");
      resource_type = "raw";
    } else if (cloudFileLink.includes("video")) {
      resource_type = "video";
    }

    const response = await cloudinary.uploader.destroy(publicId, {
      resource_type,
    });

    if (response?.result === "ok") return true;
  } catch (err) {
    console.log("Error occured while deleting from cloudinary\n", err);
    return false;
  }
};

export { uploadToCloudinary, deleteFromCloudinary, cleanupFiles };
