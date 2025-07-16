import mongoose from "mongoose";

export function isValidObjectId(value, helpers) {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error("any.invalid");
  }
  return value; 
}