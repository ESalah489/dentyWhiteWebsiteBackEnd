import mongoose, { Schema } from "mongoose";
const reviewDoctorsSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    doctor: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
  },
  { timestamps: true }
);

const ReviewDoctors = mongoose.model("ReviewDoctors", reviewDoctorsSchema);
export default ReviewDoctors;