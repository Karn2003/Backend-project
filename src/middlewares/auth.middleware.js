import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";


export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
    console.log("req.cookies", req.cookies);    
    console.log("req.header", req.header);    
    
  
    if(!token){
      throw new ApiError(401, "Unauthorized request")
    }
  
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    console.log("decoded token",decodedToken);
    
    const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
  
    if(!user){
      throw new ApiError(401, "Invalid access token")
    }
  
    req.user = user
    next()
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid token")
  }
})