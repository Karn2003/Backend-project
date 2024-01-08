import multer from "multer";

const storage = multer.diskStorage({  //The disk storage engine gives you full control on storing files to disk.
  destination: function(req, res, cb){
    // destination: used for stored file at destination return by function.
    cb(null, "./public/temp")
  },
  filename: function(req, file, cb){
    // filename: return a filename return by the function.
    cb(null, file.originalname)
  }
})

export const upload = multer(
  {
    storage,
  }
)