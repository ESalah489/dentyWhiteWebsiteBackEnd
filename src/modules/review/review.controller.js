import mongoose from "mongoose";
import ReviewDoctors from "../../../DB/models/reviewDoctors.model.js";
import Doctor from "../../../DB/models/doctor.model.js";
import Appointment from "../../../DB/models/booking.model.js";
import ReviewClinic from "../../../DB/models/reviewClinic.model.js";

// ------------------ تحديث تقييم الدكتور ------------------
const updateDoctorAverageRating = async (doctorId) => {
  const reviews = await ReviewDoctors.find({ doctor: doctorId, status: "approved" });

  const updateData = {
    "ratings.average": 0,
    "ratings.count": 0,
  };

  if (reviews.length > 0) {
    const totalRatings = reviews.reduce((sum, review) => sum + review.rating, 0);
    updateData["ratings.average"] = Number((totalRatings / reviews.length).toFixed(1));
    updateData["ratings.count"] = reviews.length;
  }

  await Doctor.findByIdAndUpdate(doctorId, updateData);
};

// ------------------ إنشاء تقييم دكتور ------------------
export const createDoctorReview = async (req, res, next) => {
  try {
    const user = req.user._id;
    const { doctorId, appointmentId, comment, rating } = req.body;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment)
      return res.status(404).json({ message: "Appointment not found" });

    if (appointment.user.toString() !== String(user))
      return res.status(403).json({ message: "Unauthorized to review this appointment" });

    if (new Date(appointment.endTime) > new Date())
      return res.status(400).json({ message: "You can only review after the session ends" });

    const existingReview = await ReviewDoctors.findOne({ user, doctor: doctorId, status: { $ne: "rejected" }});
    if (existingReview)
      return res.status(400).json({ message: "You already reviewed this doctor" });

    const newReview = await ReviewDoctors.create({
      user,
      doctor: doctorId,
      appointmentId,
      comment,
      rating,
      status: "pending",
    });

    res.status(201).json({
      success: true,
      message: "Review submitted and pending approval",
      data: newReview,
    });

  } catch (error) {
    next(error);
  }
};

// ------------------ عرض كل تقييمات دكتور ------------------
export const getAllReviewsForDoctor = async (req, res, next) => {
  try {
    const { doctorId } = req.params;

    const reviews = await ReviewDoctors.find({
      doctor: doctorId,
      status: "approved",
    })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (err) {
    next(err);
  }
};

// ------------------ عرض تقييم واحد ------------------
export const getDoctorReviewById = async (req, res, next) => {
  try {
    const review = await ReviewDoctors.findById(req.params.id);
    if (!review) return res.status(404).json({ message: "Review not found" });

    res.status(200).json(review);
  } catch (err) {
    next(err);
  }
};

// ------------------ تعديل تقييم ------------------
export const editDoctorReviewById = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { comment, rating } = req.body;

    const review = await ReviewDoctors.findById(id);
    if (!review) return res.status(404).json({ message: "Review not found" });

    if (review.user.toString() !== String(userId)) {
      return res.status(403).json({ message: "Unauthorized to edit this review" });
    }

    if (review.status !== "approved") {
      return res.status(400).json({ message: "You can only edit an approved review" });
    }

    review.pendingEdit = {
      comment: comment || review.comment,
      rating: typeof rating === "number" ? rating : review.rating,
    };
    review.editStatus = "pending";

    await review.save();

    res.status(200).json({ message: "Edit submitted for admin approval" });
  } catch (err) {
    next(err);
  }
};

// ------------------ حذف تقييم ------------------
export const deleteDoctorReviewById = async (req, res, next) => {
  try {
    const review = await ReviewDoctors.findById(req.params.id);
    if (!review) return res.status(404).json({ message: "Review not found" });

    if (review.status !== "approved") {
      return res.status(403).json({ message: "Only approved reviews can be deleted" });
    }

    const deleted = await ReviewDoctors.findByIdAndDelete(req.params.id);

    await updateDoctorAverageRating(review.doctor);

    res.status(200).json({ message: "Review deleted successfully", deleted });
  } catch (err) {
    next(err);
  }
};


// ------------------ مراجعات قيد المراجعة دكتور(أدمن) ------------------
export const getPendingReviews = async (req, res, next) => {
  try {
    const pendingReviews = await ReviewDoctors.find({ status: "pending" })
      .populate("user", "name")
      .populate("doctor", "name");

    res.status(200).json({ success: true, count: pendingReviews.length, pendingReviews });
  } catch (err) {
    next(err);
  }
};

// ------------------ مراجعات قيد المراجعة غياده(أدمن) ------------------

export const getPendingClinicReviews = async (req, res, next) => {
  try {
    const pendingClinicReviews = await ReviewClinic.find({ status: "pending" })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: pendingClinicReviews.length,
      pendingClinicReviews,
    });
  } catch (err) {
    next(err);
  }
};


// ------------------ موافقة على مراجعة دكتور ------------------
export const approveReview = async (req, res, next) => {
  try {
    const review = await ReviewDoctors.findByIdAndUpdate(
      req.params.id,
      { status: "approved" },
      { new: true }
    );

    if (!review) return res.status(404).json({ message: "Review not found" });

    await updateDoctorAverageRating(review.doctor);

    res.status(200).json({ message: "Review approved", review });
  } catch (err) {
    next(err);
  }
};

// ------------------عياده موافقة على مراجعة ------------------

export const approveClinicReview = async (req, res, next) => {
  try {
    const review = await ReviewClinic.findByIdAndUpdate(
      req.params.id,
      { status: "approved" },
      { new: true }
    ).populate("user", "name");

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.status(200).json({
      success: true,
      message: "Clinic review approved",
      review,
    });
  } catch (error) {
    next(error);
  }
};


// ------------------دكتور رفض مراجعة ------------------
export const rejectReview = async (req, res, next) => {
  try {
    const review = await ReviewDoctors.findByIdAndUpdate(
      req.params.id,
      { status: "rejected" },
      { new: true }
    );

    if (!review) return res.status(404).json({ message: "Review not found" });

    await updateDoctorAverageRating(review.doctor);

    res.status(200).json({ message: "Review rejected", review });
  } catch (err) {
    next(err);
  }
};

// ------------------عياده رفض مراجعة ------------------

export const rejectClinicReview = async (req, res, next) => {
  try {
    const review = await ReviewClinic.findByIdAndUpdate(
      req.params.id,
      { status: "rejected" },
      { new: true }
    ).populate("user", "name");

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.status(200).json({
      success: true,
      message: "Clinic review rejected",
      review,
    });
  } catch (error) {
    next(error);
  }
};


// ------------------ تقييمات العيادة ------------------
export const getClinicReviews = async (req, res, next) => {
  try {
    const reviews = await ReviewClinic.find({ status: "approved" }).populate("user", "name");
    res.status(200).json({ success: true, count: reviews.length, reviews });
  } catch (error) {
    next(error);
  }
};

// ------------------ إضافة تقييم للعيادة ------------------
export const addClinicReview = async (req, res, next) => {
  try {
    const user = req.user._id;
    const { comment, rating } = req.body;

    if (!comment || typeof rating !== "number") {
      return res.status(400).json({ message: "Comment and rating are required" });
    }

    const existingReview = await ReviewClinic.findOne({ user });
    if (existingReview) {
      return res.status(400).json({ message: "You already reviewed the clinic" });
    }

    const newReview = await ReviewClinic.create({
      user,
      comment,
      rating,
      status: "pending",
    });

    const populatedReview = await newReview.populate("user", "name email");

    res.status(201).json({
      success: true,
      message: "Review submitted and awaiting admin approval",
      review: populatedReview,
    });
  } catch (error) {
    next(error);
  }
};


// ------------------ حذف تقييم العيادة ------------------
export const deleteClinicReview = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid review ID" });
    }

    const review = await ReviewClinic.findById(id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (review.status !== "approved") {
      return res.status(403).json({ message: "Only approved reviews can be deleted" });
    }

    const deleted = await ReviewClinic.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: "Clinic review deleted", deleted });
  } catch (error) {
    next(error);
  }
};


// ------------------ تحديث حالة تقييم العيادة ------------------
export const editClinicReviewById = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { comment, rating } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid review ID" });
    }

    const review = await ReviewClinic.findById(id);
    if (!review) return res.status(404).json({ message: "Review not found" });

    if (review.user.toString() !== String(userId)) {
      return res.status(403).json({ message: "You are not authorized to edit this review" });
    }

    if (review.status !== "approved") {
      return res.status(400).json({ message: "You can only request an edit for approved reviews" });
    }

    const pendingEdit = {};
    if (comment) pendingEdit.comment = comment;
    if (typeof rating === "number") {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
      }
      pendingEdit.rating = rating;
    }

    review.pendingEdit = pendingEdit;
    review.editStatus = "pending";

    await review.save();

    res.status(200).json({
      success: true,
      message: "Edit request submitted and pending admin approval",
    });
  } catch (error) {
    next(error);
  }
};



// ------------------ جميع تقييمات الأطباء (للأدمن) ------------------
export const getAllDoctorReviewsForAdmin = async (req, res, next) => {
  try {
    const allReviews = await ReviewDoctors.find()
      .populate("user", "name email")
      .populate("doctor", "name specialty")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: allReviews.length,
      reviews: allReviews,
    });
  } catch (error) {
    next(error);
  }
};


// ------------------ جميع تقييمات العيادة (للأدمن) ------------------
export const getAllClinicReviewsForAdmin = async (req, res, next) => {
  try {
    const allClinicReviews = await ReviewClinic.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: allClinicReviews.length,
      reviews: allClinicReviews,
    });
  } catch (error) {
    next(error);
  }
};

// approve edit review for clinic

export const handleClinicReviewEditApproval = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { decision } = req.body; // "approved" or "rejected"

    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admins only" });
    }

    if (!["approved", "rejected"].includes(decision)) {
      return res.status(400).json({ message: "Invalid decision" });
    }

    const review = await ReviewClinic.findById(id);

    if (!review?.pendingEdit || Object.keys(review.pendingEdit).length === 0) {
      return res.status(404).json({ message: "No pending edit found" });
    }

    if (decision === "approved") {
      if (review.pendingEdit.comment) review.comment = review.pendingEdit.comment;
      if (typeof review.pendingEdit.rating === "number") review.rating = review.pendingEdit.rating;
      review.status = "approved";
    }

    review.pendingEdit = undefined;
    review.editStatus = decision;

    await review.save();

    res.status(200).json({
      success: true,
      message: `Edit has been ${decision}`,
      review,
    });
  } catch (error) {
    next(error);
  }
};

// approve edit review for doctor

export const handleDoctorReviewEditApproval = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { decision } = req.body;

    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admins only" });
    }

    if (!["approved", "rejected"].includes(decision)) {
      return res.status(400).json({ message: "Invalid decision" });
    }

    const review = await ReviewDoctors.findById(id);
    if (!review || !review.pendingEdit) {
      return res.status(404).json({ message: "No pending edit found" });
    }

    if (decision === "approved") {
      if (review.pendingEdit.comment) review.comment = review.pendingEdit.comment;
      if (typeof review.pendingEdit.rating === "number") review.rating = review.pendingEdit.rating;
      review.status = "approved";
    }

    review.pendingEdit = null;
    review.editStatus = decision;

    await review.save();

    await updateDoctorAverageRating(review.doctor); // تحديث المتوسط

    res.status(200).json({
      success: true,
      message: `Edit has been ${decision}`,
      review,
    });
  } catch (error) {
    next(error);
  }
};

// get edit review for doctor, clinic for admin

export const getDoctorReviewsWithPendingEdits = async (req, res, next) => {
  try {
    const pendingEdits = await ReviewDoctors.find({ editStatus: "pending", pendingEdit: { $ne: null } })
      .populate("user", "name email")
      .populate("doctor", "name specialty")
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: pendingEdits.length,
      pendingEdits,
    });
  } catch (error) {
    next(error);
  }
};


export const getClinicReviewsWithPendingEdits = async (req, res, next) => {
  try {
    const pendingEdits = await ReviewClinic.find({
      editStatus: "pending",
      pendingEdit: { $ne: null },
    })
      .populate("user", "name email")
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: pendingEdits.length,
      pendingEdits,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /admin/doctor-reviews/:id/rejected
export const deleteRejectedDoctorReview = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admins only" });
    }

    const { id } = req.params;

    const review = await ReviewDoctors.findById(id);
    if (!review) return res.status(404).json({ message: "Review not found" });

    if (review.status !== "rejected") {
      return res.status(400).json({ message: "Only rejected reviews can be deleted" });
    }

    await ReviewDoctors.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Rejected doctor review deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /admin/clinic-reviews/:id/rejected
export const deleteRejectedClinicReview = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admins only" });
    }

    const { id } = req.params;

    const review = await ReviewClinic.findById(id);
    if (!review) return res.status(404).json({ message: "Review not found" });

    if (review.status !== "rejected") {
      return res.status(400).json({ message: "Only rejected reviews can be deleted" });
    }

    await ReviewClinic.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Rejected clinic review deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};
