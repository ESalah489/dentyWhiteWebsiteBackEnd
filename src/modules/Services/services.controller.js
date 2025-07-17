import Service from "../../../DB/models/service.model.js";
import Doctor from "../../../DB/models/doctor.model.js";
import Category from "../../../DB/models/serviceCategory.model.js";
import { v2 as cloudinary } from "cloudinary";
import { extractPublicId } from "../../../utils/extractPublicId.js";
/* ---------------------------- Create Service ---------------------------- */
export const createServices = async (req, res, next) => {
  try {
    const { name, category } = req.body;
    if (!req.file) {
      return res.status(400).json({ message: "Image is required" });
    }

    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      const error = new Error("Invalid category ID!");
      error.statusCode = 400;
      return next(error);
    }

    const existingService = await Service.findOne({ name });
    if (existingService) {
      const error = new Error("Service with this name already exists!");
      error.statusCode = 400;
      return next(error);
    }

    const newService = await Service.create({
      ...req.body,
      image: req.file.path,
    });

    res.status(201).json({
      message: "Service created successfully",
      Service: newService,
    });
  } catch (err) {
    next(err);
  }
};

/* ---------------------------- Get All Services ---------------------------- */
export const getAllServices = async (req, res, next) => {
  try {
    const {
      category,
      minPrice,
      maxPrice,
      sessions,
      sortBy,
      order = "desc",
      page = 1,
      limit = 4,
    } = req.query;

    let filter = {};
    let sort = { createdAt: -1 };

    if (category) {
      const categoryArray = category.split(",");
      filter.category = { $in: categoryArray };
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

    const limitNum = Number(limit) || 12;
    const pageNum = Number(page) || 1;
    const skip = (pageNum - 1) * limitNum;

    const allServices = await Service.find(filter)
      .populate("category", "name")
      .populate("doctors", "name specialization")
      .sort(sort)
      .skip(Number(skip))
      .limit(Number(limit));

    const formattedServices = allServices.map((service) => ({
      _id: service._id,
      name: service.name,
      image: service.image,
      price: service.price,
      description: service.description,
      category: service.category?.name,
    }));

    const total = await Service.countDocuments(filter);

    res.status(200).json({
      message: "Services fetched successfully",
      total,
      page: Number(page),
      results: allServices.length,
      services: formattedServices,
    });
  } catch (err) {
    next(err);
  }
};

/* ---------------------------- Get Service by ID ---------------------------- */
export const getServiceById = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate("category", "name")
      .populate("doctors", "name");

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    const simplifiedDoctors = service.doctors.map((doctor) => ({
      _id: doctor._id,
      name: doctor.name,
    }));

    const serviceData = {
      ...service._doc,
      doctors: simplifiedDoctors,
    };

    res.status(200).json(serviceData);
  } catch (err) {
    next(err);
  }
};

/* ---------------------------- Edit Service by ID ---------------------------- */
export const editServaiceById = async (req, res, next) => {
  try {
    const updatedData = { ...req.body };

    const oldService = await Service.findById(req.params.id);
    if (!oldService) {
      return res.status(404).json({ message: "Service not found" });
    }

    if (updatedData.name && updatedData.name !== oldService.name) {
      const existing = await Service.findOne({ name: updatedData.name });
      if (existing) {
        return res.status(400).json({ message: "Service name already exists" });
      }
    }

    if (updatedData.category) {
      const categoryExists = await Category.findById(updatedData.category);
      if (!categoryExists) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
    }

    if (updatedData.doctors && Array.isArray(updatedData.doctors)) {
      for (const doctorId of updatedData.doctors) {
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
          return res
            .status(400)
            .json({ message: `Invalid doctor ID: ${doctorId}` });
        }
      }
    }

    if (req.file) {
      updatedData.image = req.file.path;

      if (oldService.image) {
        const publicId = extractPublicId(oldService.image);
        await cloudinary.uploader.destroy(publicId);
      }
    }

    const updatedService = await Service.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true }
    );
    res.status(200).json(updatedService);
  } catch (err) {
    next(err);
  }
};

/* ---------------------------- Delete Service by ID ---------------------------- */
export const deleteServiceById = async (req, res, next) => {
  try {
    const deleteService = await Service.findByIdAndDelete(req.params.id);
    if (!deleteService) {
      return res.status(400).json({ message: "Service not found" });
    }
    if (deleteService.image) {
      const publicId = extractPublicId(deleteService.image);
      await cloudinary.uploader.destroy(publicId);
    }

    res.status(200).json(deleteService);
  } catch (err) {
    next(err);
  }
};
