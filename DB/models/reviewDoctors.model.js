import mongoose, { Schema } from "mongoose";

const reviewDoctorsSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    doctor: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    pendingEdit: {
      type: {
        comment: String,
        rating: Number,
      },
      default: null,
    },
    editStatus: {
      type: String,
      enum: ["pending", "approved", "rejected", null],
      default: null,
    },

  },
  { timestamps: true }
);

// استخدم أحد الخيارين التاليين:

// الخيار 1: Default Export
export default mongoose.model("ReviewDoctors", reviewDoctorsSchema);

// الخيار 2: Named Export
// export const ReviewDoctors = mongoose.model("ReviewDoctors", reviewDoctorsSchema);