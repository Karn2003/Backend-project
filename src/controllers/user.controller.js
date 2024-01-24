import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler( async (req, res) => {
  // get user detail from frontend
  // validation - not empty
  // check if user already exist
  // check avatar and cover images exist
  // upload them to cloudinary
  // create user object
  // remove password and refresh token filed from responce
  // check for user creation 
  // return responce

  const {fullName, email, username, password } = req.body
  console.log("body ", req.body);


  if(
  [fullName, email, username, password].some((filed) => filed?.trim() === "")
){
  throw new ApiError(400, "All filed are required")
}

const existedUser = await User.findOne({
  $or: [{username}, {email}]
})
console.log("existed User", existedUser);

if(existedUser){
  throw new ApiError(409, "User with same username or email already exist")
}

const avatarLocalPath = req.files?.avatar[0]?.path
const coverImageLocalPath = req.files?.coverImage[0]?.path

console.log("req.files: ",req.files);
console.log("avatar Local Path",avatarLocalPath);

if (!avatarLocalPath) {
  throw new ApiError(400, "avatar is reqiired")
}

const avatar = await uploadOnCloudinary(avatarLocalPath)
const coverImage = await uploadOnCloudinary(coverImageLocalPath)

if (!avatar) {
  throw new ApiError(400, "avatar is reqiired")
}

const user = await User.create({
  fullName,
  avatar: avatar.url,
  coverImage: coverImage?.url || "",
  username: username.toLowerCase(),
  email,
  password
})

const createdUser = await User.findById(user._id).select(
  "-password -refreshToken"
)

if(!createdUser){
  throw new ApiError(404, "Something went wrong while registring the user")
}

res.status(201).json(
  new ApiResponse(200, createdUser, "User registerd succesfully")
)

})



export {
  registerUser
}