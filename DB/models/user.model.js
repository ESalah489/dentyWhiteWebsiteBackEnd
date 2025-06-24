import mongoose, { Schema } from "mongoose";

const userShcema = new Schema(
  {
    fristName: { type: String, required: true, trim: true, lowercase: true },
    LastName: { type: String, required: true, trim: true, lowercase: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    image: {
      type: String,
      trim: true,
      default:
        "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png",
    },
    password: { type: String, required: true, trim: true, lowercase: true },
    role: {
      type: String,
      enum: ["client", "doctor", "admin"],
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: { type: String, trim: true, lowercase: true },
    address: {
      city: { type: String, trim: true, lowercase: true },
      street: { type: String, trim: true, lowercase: true },
      country: { type: String, trim: true, lowercase: true },
      postalCode: { type: String, trim: true, lowercase: true },
    },
    age: {
      type: Number,
      trim: true,
      lowercase: true,
    },

    isLoggedIn: {
      type: Boolean,
      default: false,
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("User", userShcema);
