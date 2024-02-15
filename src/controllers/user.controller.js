import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while creating the tokens");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // get user detail from frontend
  // validation - not empty
  // check if user already exist
  // check avatar and cover images exist
  // upload them to cloudinary
  // create user object
  // remove password and refresh token filed from responce
  // check for user creation
  // return responce

  const { fullName, email, username, password } = req.body;
  // console.log("body ", req.body);

  if (
    [fullName, email, username, password].some((filed) => filed?.trim() === "")
  ) {
    throw new ApiError(400, "All filed are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  //console.log("existed User", existedUser);

  if (existedUser) {
    throw new ApiError(409, "User with same username or email already exist");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  //const coverImageLocalPath = req.files?.coverImage[0]?.path
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  // console.log("req.files: ",req.files);
  // console.log("avatar Local Path",avatarLocalPath);

  if (!avatarLocalPath) {
    throw new ApiError(400, "avatar is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "avatar is reqiired");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    username: username.toLowerCase(),
    email,
    password,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(404, "Something went wrong while registring the user");
  }

  res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registerd succesfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // take data from body
  // username and email through validation
  // find user registered or not
  // password is correct or not
  // genrate access and refresh token

  const { email, username, password } = req.body;
  // console.log("request",req.body);
  // console.log("username",username);
  if (!(username || email)) {
    throw new ApiError(400, "Username or email is required to login");
  }

  const user = await User.findOne({
    // by this method we can take user obj from the database by checking username or email is preRegistred or not
    $or: [{ username }, { email }],
  });

  // console.log("1 user obj",user);

  if (!user) {
    throw new ApiError(404, "User is not registered");
  }

  const passwordValidation = await user.isPasswordCorrect(password);

  if (!passwordValidation) {
    throw new ApiError(401, "Invalid User Credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );
  // give the access and refresh token to the user and save refresh token in user obj

  // console.log("2 accessToken, refreshToken", {accessToken, refreshToken});

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // console.log("3 loggedInUser", loggedInUser);

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User loggedIn succesfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  User.findByIdAndDelete(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(201, "", "User logout succesfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const userToken = req.cookie?.refreshToken || req.body?.refreshToken;

  if (!userToken) throw new ApiError(401, "Refresh token not found");

  const decodedToken = jwt.verify(userToken, process.env.REFRESH_TOKEN_SECRET);

  const user = await User.findById(decodedToken?._id);

  if (!user) throw new ApiError(401, "Invalid refresh token");

  if (userToken !== user.refreshToken)
    throw new ApiError(401, "Refresh token is expired");

  const options = {
    httpOnly: true,
    secure: true,
  };

  const { accessToken, newRefreshToken } = generateAccessAndRefreshToken(
    user._id
  );

  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newRefreshToken, options)
    .json(
      new ApiResponse(
        200,
        { accessToken, refreshToken: newRefreshToken },
        "refresh token genarate successfully"
      )
    );
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) throw new ApiError(400, "Invalid old password");

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password update succesfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current user fetched successfully"));
});

const updateAccountDetail = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  if (!fullName || !email) throw new ApiError(401, "All fileds are required");

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        // set method is used to update passed parameter in the object
        fullName,
        email: email,
      },
    },
    {
      new: true, // return user object after updation
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Update account detail successfully"));
});

const updateAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.url;
  if (!avatarLocalPath) throw new ApiError(400, "avatar file is missing");

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar.url) throw new ApiError(400, "error while upload on cloudinary");

  const isDeleted = await deleteFromCloudinary(req.user?.avatar);
  if (!isDeleted)
    throw new ApiError(400, "error while delete old avatar from cloudinary");
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "avatar update succesfully"));
});

const updateCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.url;
  if (!coverImageLocalPath) throw new ApiError(400, "avatar file is missing");

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!coverImage.url)
    throw new ApiError(400, "error while upload on cloudinary");

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: coverImage.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "cover image update succesfully"));
});

/* 
aggregate pipeline: consist of one or more stages
                    in aggregate pipeline code first stage filter document then that filterd document sent to the next stage.

stages: $match, $set, $group

$match => {} pass any object parameter and if match then filter that document

$group => {} group the documents by passed arguments 

$sum => {} calculate the total sum of passed para

$lookup => Performs a left outer join to a collection in the same database to filter in documents from the "joined" collection for processing
-adds a new array field to each input document. 
{
  from: (database to perform the join with.)
  localField: (A filed that is an key of object of local table which you join (fileds uses with $ sign))
  foreignField: (a filed of table passes in from)
  as: (an array name which created by this stage)
}

$addFields: to add a new entry in existing document(database) object
{
  $filedName:{
    $first: "array_name"//take arrays 0th element and add
  }
}

$cond: check condition
{
  if: a condition
  then: if condition is true then execute this
  else: if not then else
}

$in: check in array or obj filed true or false and return boolean

$project: return with added fields with 1 
{
  email: 1
}
*/

const getChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username?.trim()) throw new ApiError(400, "username is missing");

  const user = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        //gives subscribers of channel
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        //gives a user has subscribe which channel
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscriberTo",
      },
    },
    {
      $addFields: {
        subscribers: {
          $size: "$subscribers",
        },
        subscribeTo: {
          $size: "$subscriberTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscribe"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        email: 1,
        avatar: 1,
        coverImage: 1,
        isSubscribed: 1,
        subscribers: 1,
        subscribeTo: 1,
      },
    },
  ]);

  if (!user?.length) throw new ApiError(400, "user count is zero");

  return res
    .status(200)
    .json(new ApiResponse(200, user[0], "user profile retrived successfully"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetail,
  updateAvatar,
  updateCoverImage,
  getChannelProfile,
};
