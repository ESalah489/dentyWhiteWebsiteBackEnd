import Service from "../../../DB/models/service.model.js";
import Category from "../../../DB/models/serviceCategory.model.js";
import Doctor from "../../../DB/models/doctor.model.js";

export const searchServices = async (req, res, next) => {
  try {
    const {
      keyword,
      Category,
      minPrice,
      maxPrice,
      sessions,
      sortBy,
      order = "desc",
      page = 1,
      limit = 12,
    } = req.query;

    let filter = {};
    let sort = { createdAt: -1 };

    if (keyword) {
      const foundCategories = await Category.find({
        name: { $regex: keyword, $options: "i" },
      }).select("_id");

      const foundDoctors = await Doctor.find({
        name: { $regex: keyword, $options: "i" },
      }).select("_id");

      const CategoryIds = foundCategories.map((cat) => cat._id);
      const doctorIds = foundDoctors.map((doc) => doc._id);

      filter.$or = [
        { name: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
        { Category: { $in: CategoryIds } },
        { doctors: { $in: doctorIds } },
      ];
    }

    if (Category) {
      const CategoryArray = Category.split(",");
      filter.Category = { $in: CategoryArray };
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (sessions) {
      filter.sessions = { $regex: sessions, $options: "i" };
    }

    if (sortBy) {
      sort = {};
      sort[sortBy] = order === "asc" ? 1 : -1;
    }

    const limitNum = Number(limit);
    const pageNum = Number(page);
    const skip = (pageNum - 1) * limitNum;

    const services = await Service.find(filter)
      .populate("Category", "name")
      .populate("doctors", "name specialization")
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    const total = await Service.countDocuments(filter);

    res.status(200).json({
      message: "Search result",
      total,
      page: pageNum,
      results: services.length,
      services,
    });
  } catch (err) {
    next(err);
  }
};

export const getSuggestions = async (req, res, next) => {
  try {
    const { keyword } = req.query;

    const regex = new RegExp(`^${keyword}`, "i");

    const [services, doctors, categories] = await Promise.all([
      Service.find({ name: { $regex: regex } }).limit(5).select("name"),
      Doctor.find({ name: { $regex: regex } }).limit(5).select("name"),
      Category.find({ name: { $regex: regex } }).limit(5).select("name"),
    ]);

    res.status(200).json({
      services: services.map((s) => s.name),
      doctors: doctors.map((d) => d.name),
      categories: categories.map((c) => c.name),
    });
  } catch (err) {
    next(err);
  }
};