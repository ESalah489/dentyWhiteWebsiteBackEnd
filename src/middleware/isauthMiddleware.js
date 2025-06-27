import User from "../../DB/models/user.model.js";
import jwt from "jsonwebtoken";

export const isAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(403).json({ message: "Please provide token" });
    }

    const token = authHeader.split(" ")[1];

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.userId);

    if (!user) {
      return res.status(403).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
