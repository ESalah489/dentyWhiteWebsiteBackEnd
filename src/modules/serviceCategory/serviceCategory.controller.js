import Category from "../../../DB/models/serviceCategory.model.js";

/* ---------------------------- Create Category ---------------------------- */
export const createServiceCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    const existingServiceCategory = await Category.findOne({ name });
    if (existingServiceCategory) {
      return res.status(400).json({ message: "Category already exists!" });
    }

    const newServiceCategory = await Category.create({ name, description });
    res.status(201).json(newServiceCategory);
  } catch (err) {
    next(err);
  }
};

/* -------------------------- Get All Categories -------------------------- */
export const getServicesCategory = async (req, res, next) => {
  try {
    const getServicesCategory  = await Category.find().sort({ createdAt: -1 });
    res.status(200).json(getServicesCategory );
  } catch (err) {
    next(err);
  }
};

/* ------------------------ Get Category by ID ------------------------ */
export const getServiceCategoryById = async (req, res, next) => {
  try {
    const getServiceCategory = await Category.findById(req.params.id);
    if (!getServiceCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json(getServiceCategory);
  } catch (err) {
    next(err);
  }
};

/* ------------------------ Update Category by ID ------------------------ */
export const editServiceCategoryById = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    const editServiceCategory = await Category.findByIdAndUpdate(
      req.params.id,
      { name, description },
      { new: true }
    );

    if (!editServiceCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json(editServiceCategory);
  } catch (err) {
    next(err);
  }
};

/* ------------------------ Delete Category by ID ------------------------ */
export const deleteServiceCategoryById = async (req, res, next) => {
  try {
    const deleteServiceCategor = await Category.findByIdAndDelete(req.params.id);
    if (!deleteServiceCategor) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json(deleteServiceCategor);
  } catch (err) {
    next(err);
  }
};
