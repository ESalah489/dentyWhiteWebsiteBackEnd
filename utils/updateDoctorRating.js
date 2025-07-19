import Doctor from "../DB/models/doctor.model.js";
import ReviewDoctor from "../DB/models/reviewDoctors.model.js";

export async function updateDoctorAverageRating(doctorId) {
  const reviews = await ReviewDoctor.find({ doctor: doctorId, status: "approved" });

  if (reviews.length === 0) {
    await Doctor.findByIdAndUpdate(doctorId, { averageRating: 0 });
    return;
  }

  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  await Doctor.findByIdAndUpdate(doctorId, { averageRating: avgRating.toFixed(2) });
}
