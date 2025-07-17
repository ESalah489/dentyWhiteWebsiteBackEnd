import Doctor from "../../../DB/models/doctor.model.js";
import User from "../../../DB/models/user.model.js";
import Service from "../../../DB/models/service.model.js";
import ReviewDoctors from "../../../DB/models/reviewDoctors.model.js";
import { v2 as cloudinary } from "cloudinary";
import { extractPublicId } from "../../../utils/extractPublicId.js";

/* ---------------------------- Create Doctor ---------------------------- */
export const createDoctor = async (req, res, next) => {
  try {
    const {
      userId,
      specialization,
      experience,
      certifications,
      bio,
      availableTimes,
      services,
    } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== "doctor") {
      return res.status(400).json({
        message:
          "Cannot create doctor profile. Please assign this user the 'doctor' role first.",
      });
    }

    const existingDoctor = await Doctor.findOne({ user: userId });
    if (existingDoctor) {
      return res
        .status(409)
        .json({ message: "Doctor already exists for this user" });
    }

    let finalProfileImage;

    const defaultImage =
      "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

    const userHasImage = user.image && user.image.trim() !== "";

    const isDefaultImage = user.image === defaultImage;

    const adminUploadedImage = req.files?.profileImage?.[0]?.path;

    if (userHasImage && !isDefaultImage) {
      finalProfileImage = user.image;
    } else if (adminUploadedImage) {
      finalProfileImage = adminUploadedImage;
    } else {
      return res.status(400).json({
        message: "Doctor profile image is required (either from user or admin)",
      });
    }

    if (!req.files?.workImages || req.files.workImages.length === 0) {
      return res.status(400).json({ message: "Work images are required" });
    }

    const workImages = req.files.workImages.map((file) => file.path);

    const doctor = new Doctor({
      user: userId,
      specialization,
      experience,
      certifications,
      bio,
      availableTimes,
      profileImage: finalProfileImage,
      workImages,
      services,
    });

    await doctor.save();

    res.status(201).json({
      message: "Doctor created successfully",
      doctor,
    });
  } catch (error) {
    next(error);
  }
};

/* ---------------------------- Get Doctor by ID ---------------------------- */
export const getDoctorById = async (req, res, next) => {
  try {
    const doctorId = req.params.id;

    const doctor = await Doctor.findById(doctorId)
      .populate({
        path: "user",
        // match: { role: "doctor" },
        select: "firstName lastName ",
      })
      .populate({
        path: "services",
        select: "name price image description category",
        populate: {
          path: "category",
          select: "name",
        },
      });
    if (!doctor || !doctor.user) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    const reviews = await ReviewDoctors.find({ doctor: doctorId }).populate(
      "user",
      "name"
    );

    const doctorData = {
      ...doctor._doc,
      fullName: `${doctor.user.firstName} ${doctor.user.lastName}`,
    };

    delete doctorData.user;

    res.status(200).json({ doctor: doctorData, reviews });
  } catch (error) {
    next(error);
  }
};

export const getAllDoctors = async (req, res, next) => {
  try {
    const {
      service,
      specialization,
      minRating,
      maxRating,
      sortBy,
      order = "desc",
      page = 1,
      limit = 4,
      topRated,
      lowestRated,
    } = req.query;

    const filter = {};
    let sort = { createdAt: -1 };

    if (service) {
      const serviceArray = service.split(",");
      filter.services = { $in: serviceArray };
    }

    if (specialization) {
      const specializationArray = specialization.split(",");
      filter.specialization = { $in: specializationArray };
    }

    if (minRating || maxRating) {
      filter.averageRating = {};
      if (minRating) filter.averageRating.$gte = Number(minRating);
      if (maxRating) filter.averageRating.$lte = Number(maxRating);
    }

    if (topRated === "true") {
      sort = { averageRating: -1 };
    } else if (lowestRated === "true") {
      sort = { averageRating: 1 };
    } else if (sortBy) {
      sort = {};
      sort[sortBy] = order === "asc" ? 1 : -1;
    }

    const limitNum = Number(limit);
    const pageNum = Number(page);
    const skip = (pageNum - 1) * limitNum;

    const allDoctors = await Doctor.find(filter)
      .populate({
        path: "user",
        match: { role: "doctor" },
        select: "firstName lastName",
      })
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    const filteredDoctors = allDoctors
      .filter((doc) => doc.user)
      .map((doc) => ({
        _id: doc._id,
        fullName: `${doc.user.firstName} ${doc.user.lastName}`,
        specialization: doc.specialization,
        experience:doc.experience,
        averageRating: doc.averageRating,
        profileImage: doc.profileImage,
      }));
    const total = await Doctor.countDocuments(filter);

    res.status(200).json({
      message: "Doctors fetched successfully",
      total,
      page: pageNum,
      results: filteredDoctors.length,
      doctors: filteredDoctors,
    });
  } catch (error) {
    next(error);
  }
};

/* ---------------------------- Edit Doctor by ID --------------------------- */

export const editDoctorById = async (req, res, next) => {
  try {
    const doctorId = req.params.id;
    const updatedData = { ...req.body };
    console.log("✅ req.body:", req.body);
    console.log("✅ req.file (profileImage):", req.file);
    console.log("✅ req.files (workImages):", req.files);

    const oldDoctor = await Doctor.findById(doctorId);
    if (!oldDoctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    if (updatedData.services && Array.isArray(updatedData.services)) {
      for (const serviceId of updatedData.services) {
        const service = await Service.findById(serviceId);
        if (!service) {
          return res
            .status(400)
            .json({ message: `Invalid service ID: ${serviceId}` });
        }
      }
    }

    if (req.files?.profileImage?.length > 0) {
      updatedData.profileImage = req.files.profileImage[0].path;

      if (oldDoctor.profileImage) {
        const publicId = extractPublicId(oldDoctor.profileImage);
        await cloudinary.uploader.destroy(publicId);
      }
    } else {
      updatedData.profileImage = oldDoctor.profileImage;
    }

    if (req.files?.workImages?.length > 0) {
      if (oldDoctor.workImages && oldDoctor.workImages.length > 0) {
        for (const imageUrl of oldDoctor.workImages) {
          const publicId = extractPublicId(imageUrl);
          await cloudinary.uploader.destroy(publicId);
        }
      }

      updatedData.workImages = req.files.workImages.map((file) => file.path);
    }

    const updatedDoctor = await Doctor.findByIdAndUpdate(
      doctorId,
      updatedData,
      {
        new: true,
        runValidators: true,
      }
    ).populate("services");

    res.status(200).json({
      message: "Doctor updated successfully",
      doctor: updatedDoctor,
    });
  } catch (error) {
    next(error);
  }
};

/* --------------------------- Delete Doctor by ID -------------------------- */
export const deleteDoctorById = async (req, res, next) => {
  try {
    const doctorId = req.params.id;

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    if (doctor.profileImage) {
      const publicId = extractPublicId(doctor.profileImage);
      await cloudinary.uploader.destroy(publicId);
    }

    if (doctor.workImages && doctor.workImages.length > 0) {
      for (const image of doctor.workImages) {
        const publicId = extractPublicId(image);
        await cloudinary.uploader.destroy(publicId);
      }
    }

    await ReviewDoctors.deleteMany({ doctor: doctor._id });

    await Doctor.findByIdAndDelete(doctorId);

    res.status(200).json({
      message: "Doctor and related reviews deleted successfully",
      doctor,
    });
  } catch (error) {
    next(error);
  }
};

/* --------------------------- Get All Specializations -------------------------- */

export const getAllSpecializations = async (req, res, next) => {
  try {
    const specializations = await Doctor.distinct("specialization");
    res.status(200).json(specializations);
  } catch (err) {
      console.error("Error in getAllSpecializations:", err);
    next(err);
  }
};