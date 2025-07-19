import express from "express";
import {
  getAllReviewsForDoctor,
  getDoctorReviewById,
  createDoctorReview,
  editDoctorReviewById,
  deleteDoctorReviewById,
  getPendingReviews,
  approveReview,
  rejectReview,
  getClinicReviews,
  addClinicReview,
  deleteClinicReview,
  editClinicReviewById,
  getAllDoctorReviewsForAdmin,
  getAllClinicReviewsForAdmin,
  handleClinicReviewEditApproval,
  handleDoctorReviewEditApproval,
  getDoctorReviewsWithPendingEdits,
  getPendingClinicReviews,
  approveClinicReview,
  rejectClinicReview,
  getClinicReviewsWithPendingEdits,
  deleteRejectedDoctorReview,
  deleteRejectedClinicReview,
} from "./review.controller.js";
import { isAuth } from "../../middleware/isauthMiddleware.js";
import { allowRoles } from "../../middleware/checkRole.js";
import { validate } from "../../middleware/validationMiddleware.js";
import reviewJoiSchema  from "./review.validation.js";

const router = express.Router();

// ------------------ Doctor Review Routes ------------------
router.get("/doctor/:doctorId",isAuth, getAllReviewsForDoctor); 
router.get("/doctor/id/:id",isAuth, getDoctorReviewById);       
router.post("/doctor",isAuth, validate(reviewJoiSchema), createDoctorReview);
router.put("/doctor/:id",isAuth, validate(reviewJoiSchema), editDoctorReviewById);
router.delete("/doctor/:id",isAuth, deleteDoctorReviewById);

// ------------------ Clinic Review Routes ------------------
router.get("/clinic",isAuth, getClinicReviews);                 
router.post("/clinic",isAuth, addClinicReview);
router.delete("/clinic/:id",isAuth, deleteClinicReview);
router.put("/clinic-reviews/:id", isAuth, editClinicReviewById);

// ------------------ Admin Review Routes ------------------
router.get("/admin/pending",isAuth, allowRoles("admin"), getPendingReviews);
router.get("/clinic-reviews/pending", isAuth, allowRoles("admin"), getPendingClinicReviews);

router.patch("/admin/approve/:id",isAuth, allowRoles("admin"), approveReview);
router.put("/clinic-reviews/approve/:id", isAuth, allowRoles("admin"), approveClinicReview);

router.patch("/admin/reject/:id",isAuth, allowRoles("admin"), rejectReview);
router.put("/clinic-reviews/reject/:id", isAuth, allowRoles("admin"), rejectClinicReview);

router.get("/admin/doctor-reviews", isAuth, allowRoles("admin"), getAllDoctorReviewsForAdmin);
router.get("/admin/clinic-reviews", isAuth, allowRoles("admin"), getAllClinicReviewsForAdmin);

router.put("/clinic-reviews/edit-decision/:id", 
  isAuth, allowRoles("admin"), handleClinicReviewEditApproval); 

router.put("/doctor-reviews/edit-decision/:id", isAuth, 
  allowRoles("admin"), handleDoctorReviewEditApproval);

router.get("/doctor-reviews/pending-edits", isAuth, allowRoles("admin"), getDoctorReviewsWithPendingEdits);
router.get("/clinic-reviews/pending-edits", isAuth, allowRoles("admin"), getClinicReviewsWithPendingEdits);


router.delete("/admin/doctor-reviews/rejected/:id", isAuth, allowRoles("admin"),deleteRejectedDoctorReview);
router.delete("/admin/clinic-reviews/rejected/:id", isAuth, allowRoles("admin"),deleteRejectedClinicReview);

export default router;
