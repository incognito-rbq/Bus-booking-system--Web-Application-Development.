import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/UserSchema.js";
import localAuthMiddleware from "../middleware/localAuth.middleware.js";
import jwtAuth from "../middleware/jwtAuth.middleware.js";

const userRouter = express.Router();

/* Common Endpoints */
userRouter.post("/signup", async (req, res) => {
  try {
    const data = req.body;

    if (!data) {
      return res
        .status(400)
        .json({ msg: "Bad Request: User data not provided." });
    }

    if (Array.isArray(req.body)) {
      await User.insertMany(req.body);
      return res.status(201).json({ msg: "Users created successfully." });
    }

    const user = new User(data);
    user.isVerified = true;

    await user.save();
    res.status(201).json({ msg: "User created successfully!" });
  } catch (err) {
    console.error("Signup Error:", err);

    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ msg: errors, error: err });
    }

    // Check for Duplicate Key Error
    if (err.code === 11000) {
      return res.status(400).json({ msg: "Email or Phone already exists." });
    }

    res.status(500).json({
      msg: "Internal Server Error",
      error: err,
    });
  }
});

userRouter.post("/login", localAuthMiddleware, (req, res) => {
  // creating payload with user_id, email and role
  const payload = { id: req.user._id, email: req.user.email, role: req.user.role };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1d" });

  res.status(200).json({
    msg: "Login successful",
    token,
    user: payload,
  });
});

userRouter.get("/profile", jwtAuth, async (req, res) => {
  try {
    const user = req.user;
    res
      .status(200)
      .json({ msg: "User profile fetched successfully", data: user });
  } catch (err) {
    res.status(500).json({
      msg: "Internal Server Error",
      err: err.message,
    });
  }
});

userRouter.put("/change-email", jwtAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ msg: "No fields to update" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { email },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    res.status(200).json({
      msg: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (err) {
    res.status(500).json({
      msg: "Internal Server Error",
      err: err,
    });
  }
});

userRouter.put("/change-phone", jwtAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ msg: "No fields to update" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { phone },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    res.status(200).json({
      msg: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (err) {
    res.status(500).json({
      msg: "Internal Server Error",
      err: err,
    });
  }
});

userRouter.put("/change-password", jwtAuth, async (req, res) => {
  try {
    const { currentpassword, newpassword } = req.body;

    if (!currentpassword || !newpassword) {
      return res.status(400).json({
        msg: "Current password and new password are required",
      });
    }

    // Fetch user from DB to ensure password is present
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    // Verify old password
    const isMatch = await user.comparePassword(currentpassword);
    if (!isMatch) {
      return res.status(401).json({
        msg: "Current password is incorrect",
      });
    }

    // Set new password (pre-save hook hashes it)
    user.password = newpassword;
    await user.save();

    res.status(200).json({
      msg: "Password changed successfully",
    });
  } catch (err) {
    res.status(500).json({
      msg: "Internal Server Error",
      error: err.message,
    });
  }
});

userRouter.delete("/delete-account", jwtAuth, async (req, res) => {
  try {
    const { userpassword } = req.body;
    const userId = req.user._id;

    if (!userpassword) {
      return res.status(400).json({ msg: "Password is required to delete account. "});
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const isMatch = await user.comparePassword(userpassword);
    if (!isMatch) {
      return res.status(401).json({ msg: "Password is Invalid. Account Deletion Failed." });
    }

    // soft delete by assigning isDeleted = true
    const deletedUser = await User.findOneAndUpdate(
      { _id: userId, isDeleted: false },
      { isDeleted: true },
      { new: true, runValidators: true }
    );

    if (!deletedUser) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.status(200).json({
      msg: "Account deleted successfully.",
      data: deletedUser,
    });
  } catch (err) {
    res.status(500).json({
      msg: "Internal Server Error",
      error: err.message,
    });
  }
});

/* Admin Endpoints */
userRouter.get("/customer-details", jwtAuth, async (req, res) => {
  try {
    // Authenticated user comes from jwtAuth
    const user = req.user;

    // Only admin can access
    if (user.role !== "admin") {
      return res
        .status(403)
        .json({ msg: "Forbidden: This page is restricted." });
    }

    const customers = await User.find({ role: "customer" });

    if (customers.length === 0) {
      return res.status(404).json({ msg: "No customers found." });
    }

    const message = `Customer(s) Found: ${customers.length}`;
    res.status(200).json({
      msg: message,
      data: customers,
    });
  } catch (err) {
    res.status(500).json({
      msg: "Internal Server Error",
      error: err.message,
    });
  }
});

userRouter.get("/driver-details", jwtAuth, async (req, res) => {
  try {
    // Authenticated user comes from jwtAuth
    const user = req.user;

    // Only admin can access
    if (user.role !== "admin") {
      return res
        .status(403)
        .json({ msg: "Forbidden: This page is restricted." });
    }

    const drivers = await User.find({ role: "driver" });

    if (drivers.length === 0) {
      return res.status(404).json({ msg: "No drivers found." });
    }

    const message = `Driver(s) Found: ${drivers.length}`;
    res.status(200).json({
      msg: message,
      data: drivers,
    });
  } catch (err) {
    res.status(500).json({
      msg: "Internal Server Error",
      error: err.message,
    });
  }
});

export default userRouter;
