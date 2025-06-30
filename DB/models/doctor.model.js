import mongoose, { Schema } from "mongoose";

const doctorSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    specialization: [{ type: String, required: true, trim: true }],
    experience: { type: Number, required: true },
    certifications: [{ type: String }],
    bio: { type: String },
    availableTimes: [
      {
        day: { type: String, required: true },
        slots: [
          {
            from: { type: String, required: true },
            to: { type: String, required: true },
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

const Doctor = mongoose.model("Doctor", doctorSchema);
export default Doctor;
