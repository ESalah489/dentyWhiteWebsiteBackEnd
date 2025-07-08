import Doctor from "../../../DB/models/doctor.model.js";
import User from "../../../DB/models/user.model.js";

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
    } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== "doctor") {
      return res
        .status(400)
        .json({ message: "User is not assigned as a doctor" });
    }

    const existingDoctor = await Doctor.findOne({ user: userId });
    if (existingDoctor) {
      return res
        .status(409)
        .json({ message: "Doctor already exists for this user" });
    }

    const doctor = new Doctor({
      user: userId,
      specialization,
      experience,
      certifications,
      bio,
      availableTimes,
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

    const doctor = await Doctor.findById(doctorId).populate({
      path: "user",
      match: { role: "doctor" },
      populate: {
        path: "address",
      },
    });

    if (!doctor || !doctor.user) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.status(200).json({ doctor });
  } catch (error) {
    next(error);
  }
};

/* ---------------------------- Get All Doctors  ---------------------------- */
export const getAllDoctors = async (req, res, next) => {
  try {
    const doctors = await Doctor.find().populate({
      path: "user",
      match: { role: "doctor" },
      populate: {
        path: "address",
      },
    });

    const filteredDoctors = doctors.filter((d) => d.user !== null);

    res.status(200).json({ doctors: filteredDoctors });
  } catch (error) {
    next(error);
  }
};

/* ---------------------------- Edit Doctor by ID --------------------------- */
export const editDoctorById = async (req, res, next) => {
  try {
    const doctorId = req.params.id;

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const { specialization, experience, certifications, bio, availableTimes } =
      req.body;

    doctor.specialization = specialization || doctor.specialization;
    doctor.experience = experience || doctor.experience;
    doctor.certifications = certifications || doctor.certifications;
    doctor.bio = bio || doctor.bio;
    doctor.availableTimes = availableTimes || doctor.availableTimes;

    await doctor.save();

    res.status(200).json({
      message: "Doctor updated successfully",
      doctor,
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

    await Doctor.findByIdAndDelete(doctorId);

    res.status(200).json({ message: "Doctor deleted successfully", doctor });
  } catch (error) {
    next(error);
  }
};
