import Doctor from "../../../DB/models/doctor.model.js";

 /* ---------------------------- Get Doctor by ID ---------------------------- */
 export const getDoctorById = async (req, res, next) => {
  try {
    const doctorId = req.params.id;
    const doctor = await Doctor.findById(doctorId).populate("user");
    if (!doctor) {
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
    const doctors = await Doctor.find().populate("user");
    res.status(200).json({ doctors });
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
