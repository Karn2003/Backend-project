import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json({limit: "16kb"}))//This is a built-in middleware function in Express. It parses incoming requests with JSON payloads and is based on body-parser.
//app.use() used where we need to setting of middleware or configration
app.use(express.urlencoded({extended: true, limit: "16kb"}))//urlencoded use for data accept from url and extended use for get data from object in object
app.use(express.static("public"))//make a public assets 
app.use(cookieParser())//access/set user cookies from browser


//import router
import userRouter from "./routes/user.routes.js";//if we do export default then we can give import name as out choice

//routes declaration
app.use("/api/v1/users", userRouter)



export { app };
