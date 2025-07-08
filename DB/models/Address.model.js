import mongoose, { Schema } from "mongoose";

const addressSchema = new Schema({
  city: { type: String, trim: true, lowercase: true, default: "city" },
  street: { type: String, trim: true, lowercase: true, default: "street" },
  country: { type: String, trim: true, lowercase: true, default: "country" },
  postalCode: {
    type: String,
    trim: true,
    lowercase: true,
    default: "postalCode",
  },
});

const Address = mongoose.model("Address", addressSchema);
export default Address;
