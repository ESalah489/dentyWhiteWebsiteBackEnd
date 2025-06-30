import User from "../../../DB/models/user.model.js";
/* ---------------------------- Get User by ID ---------------------------- */

export const getUserById = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

/* ---------------------------- Get All Users ---------------------------- */

export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find();
    res.status(200).json({ users });
  } catch (error) {
    next(error);
  }
};
/* ---------------------------- Edit User by ID ---------------------------- */

export const EditUserDataById = async (req, res, next) => {
  try {
    const { error } = updateUserSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      return res.status(400).json({
        message: "Validation error",
        details: error.details.map((d) => d.message),
      });
    }

    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const {
      firstName,
      lastName,
      phone,
      address,
      age,
      clientWork,
    } = req.body;

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.phone = phone || user.phone;
    user.address = address || user.address;
    user.age = age || user.age;
    user.clientWork = clientWork || user.clientWork;

    if (req.file) {
      user.image = `http://localhost:5000/uploads/${req.file.filename}`;
    }

    await user.save();

    res.status(200).json({
      message: "User updated successfully",
      user,
    });
  } catch (error) {
    next(error);
  }
};

/* ---------------------------- Delete User by ID ---------------------------- */

export const deleteUserById = async (req, res, next) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await User.findByIdAndDelete(userId);

    res.status(200).json({ message: "User deleted successfully", user });
  } catch (error) {
    next(error);
  }
};

/* ----------------------------- Update User Role ----------------------------- */

export const updateUserRole = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const { role } = req.body;

    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admin can update roles" });
    }

    const allowedRoles = ["client", "doctor", "admin"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User role updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};
