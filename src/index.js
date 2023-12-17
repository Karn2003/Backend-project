import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
  path: "./env",
});

connectDB()
.then(
  app.listen(process.env.PORT || 8080, () => {
    console.log(`server is ready to serve at port no ${process.env.PORT}`);
  })
)
.catch((err) => {
  console.log("MONGO db connection error !!! ", err);
})
