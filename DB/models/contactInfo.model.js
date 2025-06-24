import mongoose, { Schema } from "mongoose";
const contactInfoSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: false },
    name: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ContactInfo", contactInfoSchema);
