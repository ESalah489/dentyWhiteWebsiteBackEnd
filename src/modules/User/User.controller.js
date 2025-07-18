import User from "../../../DB/models/user.model.js";
import Address from "../../../DB/models/Address.model.js";
import bcrypt from "bcryptjs";
/* -------------------------- create user by admin -------------------------- */
export const createUser = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      image,
      role,
      phone,
      address,
      age,
      clientWork,
    } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let addressId = undefined;
    if (address) {
      const newAddress = new Address(address);
      await newAddress.save();
      addressId = newAddress._id;
    }

    const newUser = new User({
      firstName,
      lastName,
      email,
      image,
      password: hashedPassword,
      role,
      phone,
      address: addressId,
      age,
      clientWork,
    });

    await newUser.save();

    const { password: _, ...userWithoutPassword } = newUser.toObject();

    res.status(201).json({
      message: "User created successfully",
      user: userWithoutPassword,
    });
  } catch (error) {
    next(error);
  }
};
/* ---------------------------- Get User by ID ---------------------------- */

export const getUserById = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).populate("address");
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
    const users = await User.find().populate("address");
    res.status(200).json({ users });
  } catch (error) {
    next(error);
  }
};

/* ---------------------------- Edit User by ID ---------------------------- */

export const EditUserDataById = async (req, res, next) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId).populate("address");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { firstName, lastName, phone, address, age, clientWork } = req.body;
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.phone = phone || user.phone;
    user.age = age || user.age;
    user.clientWork = clientWork || user.clientWork;

    if (req.file) {
      user.image = req.file.path;
    }

    if (address) {
      if (user.address) {
        await Address.findByIdAndUpdate(user.address._id, address, {
          new: true,
        });
      } else {
        const newAddress = await Address.create(address);
        user.address = newAddress._id;
      }
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

    if (user.address) {
      await Address.findByIdAndDelete(user.address);
    }

    await User.findByIdAndDelete(userId);

    res.status(200).json({ message: "User and address deleted", user });
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
