import mongoose,{Schema} from "mongoose";
const serviceCategorySchema=new Schema({
    name: { type: String, required: true, trim: true,unique: true,index:true },
    description: { type: String,required: true },
},
  { timestamps: true }
);

const Category = mongoose.model("Category", serviceCategorySchema);
export default Category;
