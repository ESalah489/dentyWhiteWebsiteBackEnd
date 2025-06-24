import mongoose, { Schema } from "mongoose";
const offerSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    discountPercentage: { type: Number, required: true },
    validFrom: { type: Date, required: true },
    validTo: { type: Date, required: true },
    applicableServices: [{ type: Schema.Types.ObjectId, ref: "Service" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Offer", offerSchema);
