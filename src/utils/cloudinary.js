import { v2 as cloudinary } from "cloudinary";
import fs from "node:fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if(!localFilePath) return null
    const responce = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto"
    })
    console.log("file upload succesfully on cloudinary ", responce.url);
    return responce
  } catch (error) {
    fs.unlink(localFilePath, (error) => {
      console.log("Error cloudinary :: file is deleted due to error in upload: ", error);
    })
    
    return null
  }
}


const deleteFromCloudinary = async (localFilePath) => {
  try {
    if(!localFilePath) return null
    await cloudinary.uploader.destroy(localFilePath, {
      resource_type: "auto"
    })
    console.log("file deleted succesfully from cloudinary ");
  } catch (error) {
    console.log("error while delete from cloudinary", error);
  }
}
export {uploadOnCloudinary, deleteFromCloudinary}