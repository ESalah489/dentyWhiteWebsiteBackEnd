import mongoose, { Schema } from "mongoose";

const serviceSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },
    price: { type: Number, required: true },
    duration: { type: String },
    doctor: { type: Schema.Types.ObjectId, ref: "Doctor" },
    image: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Service", serviceSchema);
