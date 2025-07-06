import Services from "../../../DB/models/service.model.js";
import serviceCategory from "../../../DB/models/serviceCategory.model.js";
import Doctor from "../../../DB/models/doctor.model.js";
import fs from "fs/promises";
import path from "path";

/* ---------------------------- Create Service ---------------------------- */
export const createServices = async (req, res, next) => {
    try {
        const { name, category } = req.body;
        if (!req.file) {
            return res.status(400).json({ message: "Image is required" });
        };

        const categoryExists = await serviceCategory.findById(category);
        if (!categoryExists) {
            const error = new Error("Invalid category ID!");
            error.statusCode = 400;
            return next(error);
        }

        const existingService = await Services.findOne({ name });
        if (existingService) {
            const error = new Error("Service with this name already exists!");
            error.statusCode = 400;
            return next(error);
        };

        const newService = await Services.create({
            ...req.body,
            image: req.file.filename
        });

        res.status(201).json({
            message: "Service created successfully",
            Service: newService
        });
    } catch (err) {
        next(err)
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
            limit = 12,
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

        const allServices = await Services.find(filter)
            .populate("category", "name")
            .populate("doctors", "name specialization")
            .sort(sort)
            .skip(Number(skip))
            .limit(Number(limit));

        const total = await Services.countDocuments(filter);

        res.status(200).json({
            message: "Services fetched successfully",
            total,
            page: Number(page),
            results: allServices.length,
            services: allServices,
        });
    } catch (err) {
        next(err)
    }

};

/* ---------------------------- Get Service by ID ---------------------------- */
export const getServiceById = async (req, res, next) => {
    try {
        const ServiceById = await Services.findById(req.params.id)
            .populate("category", "name")
            .populate("doctors", "name specialization");

        if (!ServiceById) {
            return res.status(404).json({ message: "Service not found" })
        }

        res.status(200).json(ServiceById);
    } catch (err) {
        next(err)
    }
};

/* ---------------------------- Edit Service by ID ---------------------------- */
export const editServiceById = async (req, res, next) => {
    try {
        const updatedData = { ...req.body };

        if (req.file) {
            updatedData.image = req.file.filename;
        }

        const oldService = await Services.findById(req.params.id);
        if (!oldService) {
            return res.status(404).json({ message: "Service not found" });
        }

        if (updatedData.name && updatedData.name !== oldService.name) {
            const existing = await Services.findOne({ name: updatedData.name });
            if (existing) {
                return res.status(400).json({ message: "Service name already exists" });
            }
        }

        if (updatedData.category) {
            const categoryExists = await serviceCategory.findById(updatedData.category);
            if (!categoryExists) {
                return res.status(400).json({ message: "Invalid category ID" });
            }
        }

        if (updatedData.doctors && Array.isArray(updatedData.doctors)) {
            for (const doctorId of updatedData.doctors) {
                const doctor = await Doctor.findById(doctorId);
                if (!doctor) {
                    return res.status(400).json({ message: `Invalid doctor ID: ${doctorId}` });
                }
            }
        }

        const updatedService = await Services.findByIdAndUpdate(
            req.params.id,
            updatedData,
            { new: true }
        );

        if (req.file && oldService.image) {
            const oldImagePath = path.join("uploads", oldService.image);
            try {
                await fs.unlink(oldImagePath);
            } catch (err) {
                console.error("Failed to delete old image:", err.message);
            }
        }

        res.status(200).json(updatedService);
    } catch (err) {
        next(err)
    }
};


/* ---------------------------- Delete Service by ID ---------------------------- */
export const deleteServiceById = async (req, res, next) => {
    try {
        const deleteService = await Services.findByIdAndDelete(req.params.id);
        if (!deleteService) {
            return res.status(400).json({ message: "Service not found" });
        }
        const imagePath = path.join("uploads", deleteService.image);

        try {
            await fs.unlink(imagePath);
        } catch (err) {
            console.error("Failed to delete image:", err.message);
        }

        res.status(200).json(deleteService);

    } catch (err) {
        next(err)
    }

}; 