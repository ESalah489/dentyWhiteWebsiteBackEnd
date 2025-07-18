import mongoose, { Schema } from "mongoose";

const doctorSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    profileImage:{ type: String ,},
    specialization: [{ type: String, required: true, trim: true }],
    experience: { type: Number, required: true },
    certifications: [{ type: String ,required: true}],
    bio: { type: String,required: true },
    services: [{ type: mongoose.Schema.Types.ObjectId, ref: "Service" }],
    workImages: [{ type: String,required: true }],
    averageRating: { type: Number, default: 0 },
    numberOfReviews: { type: Number, default: 0 },
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
