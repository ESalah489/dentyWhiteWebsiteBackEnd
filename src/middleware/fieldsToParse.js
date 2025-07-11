export const parseDoctorFields = (req, res, next) => {
  try {
    const fieldsToParse = ["availableTimes", "certifications", "services", "specialization"];

    for (const field of fieldsToParse) {
      if (Array.isArray(req.body[field]) && req.body[field].length === 1 && typeof req.body[field][0] === "string") {
        try {
          const parsed = JSON.parse(req.body[field][0]);
          if (Array.isArray(parsed)) {
            req.body[field] = parsed;
          }
        } catch (_) {}
      } else if (typeof req.body[field] === "string") {
        req.body[field] = JSON.parse(req.body[field]);
      }
    }

    next();
  } catch (err) {
    return res.status(400).json({ message: "Invalid JSON format in body fields" });
  }
};
