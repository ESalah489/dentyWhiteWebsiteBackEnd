import mongoose, { Schema } from "mongoose";
const paymentSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    service: { type: Schema.Types.ObjectId, ref: "Service", required: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    method: { type: String, enum: ["cash", "online"] },
    transactionId: { type: String },
    paymentGateway: { type: String, enum: ["stripe", "paymob", "paypal"] }, 
    paymentDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
