import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../../../DB/models/user.model.js";

/* -------------------------------- Register -------------------------------- */
export const register = async (req, res, next) => {
  try {
    const { error } = registerSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        message: "Validation error",
        details: error.details.map((d) => d.message),
      });
    }

    const { firstName, lastName, email, password, phone, address, age } =
      req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phone,
      address,
      age,
    });

    await newUser.save();

    res.status(201).json({
      message: "User registered successfully",
      userId: newUser._id,
    });
  } catch (error) {
    next(error);
  }
};

/* ---------------------------------- Login --------------------------------- */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid email or password" });

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    user.isLoggedIn = true;
    await user.save();

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/* ---------------------------------- LogOut --------------------------------- */
export const logout = async (req, res, next) => {
  try {
    const userId = req.user?._id || null;
    console.log(userId);
    if (userId) {
      await User.findByIdAndUpdate(userId, { isLoggedIn: false });
    }
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
};
/* ----------------------------- Forget Password ---------------------------- */
export const forgetPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Email not found" });

    const token = jwt.sign(
      { userId: user._id },
      process.env.RESET_PASSWORD_SECRET,
      { expiresIn: "15m" }
    );

    const resetLink = `http://localhost:3000/reset-password/${token}`; // this will change in  future

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Clinic App" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Reset Your Password",
      html: `
        <p>Hello ${user.firstName},</p>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>This link is valid for 15 minutes only.</p>
      `,
    });

    res.status(200).json({ message: "Reset link sent to your email." });
  } catch (error) {
    next(error);
  }
};

/* ----------------------------- reset password ----------------------------- */
export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    const decoded = jwt.verify(token, process.env.RESET_PASSWORD_SECRET);
    const userId = decoded.userId;

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(userId, { password: hashedPassword });

    res.status(200).json({ message: "Password reset successful." });
  } catch (error) {
    return res.status(400).json({ message: "Invalid or expired token" });
  }
};
