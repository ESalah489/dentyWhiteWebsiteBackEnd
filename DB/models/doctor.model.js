import mongoose, { Schema } from "mongoose";

const doctorSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    specialization: { type: String, required: true, trim: true },
    experience: { type: Number, required: true },
    certifications: [{ type: String }],
    bio: { type: String },
    availableTimes: [
      {
        day: String,
        from: String,
        to: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Doctor", doctorSchema);
