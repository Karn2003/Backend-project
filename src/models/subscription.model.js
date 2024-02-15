import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema({
  subscriber: { //a user which subscribe to the other channel
    type: Schema.Types.ObjectId,
    ref: "User"
  },
  channel: {// also a user who have channel
    type: Schema.Types.ObjectId,
    ref: "User"
  }
}, {timestamps: true})

export const Subscription = mongoose.model("Subscription", subscriptionSchema)//if i want to use this model elseware then uses with name as lowercase and plural form of name(concat with s)