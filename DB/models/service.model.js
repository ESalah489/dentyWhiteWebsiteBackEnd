import mongoose, { Schema } from "mongoose";

const serviceSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },
    price: { type: Number, required: true },
    duration: { type: String },
    doctors: [{ type: Schema.Types.ObjectId, ref: "Doctor" }],
    image: { type: String },
  },
  { timestamps: true }
);

const Service = mongoose.model("Service", serviceSchema);
export default Service;