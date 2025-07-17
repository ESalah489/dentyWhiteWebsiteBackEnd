import mongoose, { Schema } from "mongoose";

const reviewClinicSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
  status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    pendingEdit: {
    comment: { type: String },
    rating: { type: Number, min: 1, max: 5 }
  },
  editStatus: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  }

}, { timestamps: true });

const ReviewClinic = mongoose.model("ReviewClinic", reviewClinicSchema);
export default ReviewClinic;