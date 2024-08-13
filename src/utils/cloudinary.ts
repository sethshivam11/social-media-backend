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
  type: "message" | "video" | "story" | "post" | "avatar" | "report" | "miscellaneous"
) => {
  try {
    if (!localFilePath) return null;
    const presets = JSON.parse(process.env.CLOUDINARY_UPLOAD_PRESETS || "{}");
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      upload_preset: presets[type],
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
    const publicId = urlArray[urlArray?.length - 1].split(".")[0];

    const response = await cloudinary.uploader.destroy(`sociial/${publicId}`);

    if (response?.result === "ok") return true;
  } catch (err) {
    console.log("Error occured while deleting from cloudinary\n", err);
    return false;
  }
};

export { uploadToCloudinary, deleteFromCloudinary, cleanupFiles };
