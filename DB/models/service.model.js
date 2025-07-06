import mongoose, { Schema } from "mongoose";

const serviceSchema = new Schema(
  {
    name: { type: String, required: true, trim: true,unique: true,index: true},
    description: { type: String,required: true },
    price: { type: Number, required: true,index: true },
    sessions:{ type: String,index: true},
    duration: { type: String,required: true},
    doctors: [{ type: Schema.Types.ObjectId, ref: "Doctor",required: true,index: true }],
    category: { type: Schema.Types.ObjectId, ref: "category", required: true ,index: true},
    image: { type: String,required: true},
  },
  { timestamps: true }
);
serviceSchema.index({ createdAt: -1 });

const Service = mongoose.model("Service", serviceSchema);
export default Service;
