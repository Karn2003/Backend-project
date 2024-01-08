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
app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())


//import router
import userRouter from "./routes/user.routes.js";//if we do export default then we can give import name as out choice

//routes declaration
app.use("/api/v1/users", userRouter)



export { app };
