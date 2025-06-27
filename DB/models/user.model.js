import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
  {
    firstName: { type: String, required: true, trim: true, lowercase: true },
    lastName: { type: String, required: true, trim: true, lowercase: true },
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
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["client", "doctor", "admin"],
      trim: true,
      lowercase: true,
      default: "client",
    },
    phone: { type: String, trim: true, lowercase: true },
    address: {
      city: { type: String, trim: true, lowercase: true, default: "City" },
      street: { type: String, trim: true, lowercase: true, default: "street" },
      country: {
        type: String,
        trim: true,
        lowercase: true,
        default: "country",
      },
      postalCode: {
        type: String,
        trim: true,
        lowercase: true,
        default: "postalCode",
      },
    },
    age: {
      type: Number,
    },
    clientWork: {
      type: String,
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
const User = mongoose.model("User", userSchema);
export default User;
