import User from "../../../DB/models/user.model.js";
import Doctor from "../../../DB/models/doctor.model.js";
import Service from "../../../DB/models/service.model.js";
import Appointment from "../../../DB/models/booking.model.js";

export const getCounts = async (req, res) => {
  try {
    const [clientsCount, doctorsCount, servicesCount, appointmentsCount] = await Promise.all([
      User.countDocuments({ role: "client" }),
      Doctor.countDocuments(),
      Service.countDocuments(),
      Appointment.countDocuments()
    ]);

    res.status(200).json({
      clients: clientsCount,
      doctors: doctorsCount,
      services: servicesCount,
      appointments: appointmentsCount
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching counts", error: error.message });
  }
};
