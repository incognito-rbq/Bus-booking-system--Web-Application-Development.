import express from "express";
import Bus from "../models/BusSchema.js";
import User from "../models/UserSchema.js";
import jwtAuth from "../middleware/jwtAuth.middleware.js";
const BusRouter=express.Router();
const isAdmin = (req, res, next) => {
    if (req.user.role !== "admin") {
      return res.status(403).json({ 
        msg: "Forbidden: Only admins can access this resource." 
      });
    }
    next();
  };

  // add bus
BusRouter.post("/add", jwtAuth, isAdmin, async (req, res) => {
    try {
      const data = req.body;
  
      if (!data) {
        return res.status(400).json({ message:"Bad Request: Bus data not provided."});
      }
        if (!data.busId || !data.driverId) {
        return res.status(400).json({ message: "Bus ID and Driver ID are required."});
      }
        const driver = await User.findById(data.driverId);
      if (!driver) {
        return res.status(404).json({ message: "Driver not found." });
      }
      if (driver.role !== "driver") {
        return res.status(400).json({  message: "The specified user is not a driver." });
      }
  
      const newBus = new Bus(data);
      await newBus.save();
  
      res.status(201).json({
        message: "Bus added successfully.",
        data: newBus
      });
    } catch (err) {
      console.error("Add Bus Error:", err);
  
      if (err.code === 11000) {
        return res.status(400).json({ message: "Bus ID already exists." });
      }
  
      if (err.name === "ValidationError") {
        const errors = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({ message: errors });
      }
  
      res.status(500).json({message: "Internal Server Error"});
        
    }
  });

  // get bus all

BusRouter.get("/all", jwtAuth, isAdmin, async (req, res) => {
    try {
      const buses = await Bus.find()
        .populate("driverId", "name email phone");
      if (buses.length === 0) {
        return res.status(404).json({ message: "No buses found." });
      }
      res.status(200).json({
        message:"All buses fetched successfully",
        data: buses
      });
    } catch (err) {
      res.status(500).json({err: "Internal Server Error" });
    }
  });
  
  // get bus by id
BusRouter.get("/:id", jwtAuth, isAdmin, async (req, res) => {
    try {
      const id = req.params.id;
  
      const bus = await Bus.findById(id)
        .populate("driverId", "name email phone");
  
      if (!bus) {
        return res.status(404).json({ message: "Bus not found." });
      }
  
      res.status(200).json({
        message: "Bus details fetched successfully.",
        data: bus
      });
    } catch (err) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // update by id a bus
  
  BusRouter.put("/update/:id", jwtAuth, isAdmin, async (req, res) => {
    try {
      const id = req.params.id;
      const data = req.body;
  
      if (!data) {
        return res.status(400).json({ message: "No fields to update."});
      }
        if (data.driverId) {
        const driver = await User.findById(data.driverId);
        
        if (!driver) {
          return res.status(404).json({ message: "Driver not found." });
        }
        
        if (driver.role !== "driver") {
          return res.status(400).json({ 
            message: "The specified user is not a driver." 
          });
        }
      }
  
      const updatedBus = await Bus.findByIdAndUpdate(
        id,
        data,
        { new: true, runValidators: true }
      ).populate("driverId", "name email phone");
  
      if (!updatedBus) {
        return res.status(404).json({ message: "Bus not found." });
      }
  
      res.status(200).json({
        message: "Bus updated successfully.",
        data: updatedBus
      });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(400).json({   message: "Bus ID already exists."});
      }
  
      res.status(500).json({ err: "Internal Server Error"});
    }
  });
  

  // delete bus by id
BusRouter.delete("/delete/:id", jwtAuth, isAdmin, async (req, res) => {
    try {
      const id = req.params.id;
  
      const deletedBus = await Bus.findByIdAndDelete(id);
  
      if (!deletedBus) {
        return res.status(404).json({ message:"Bus not found" });
      }
  
      res.status(200).json({
         message: "Bus deleted successfully.",
        data: deletedBus
      });
    } catch (err) {
      res.status(500).json({
        msg: "Internal Server Error",
        error: err.message
      });
    }
  });


//get bus by driver id
BusRouter.get("/driver/:id", jwtAuth, isAdmin, async (req, res) => {
    try {
      const { driverId } = req.params;
  
      const buses = await Bus.find({ driverId })
        .populate("driverId", "name email phone");
  
      if (buses.length === 0) {
        return res.status(404).json({message: "No buses found for this driver."  });
      }
      res.status(200).json({
        message: "bus found succssfully",
        data: buses
      });
    } catch (err) {
      res.status(500).json({
        msg: "Internal Server Error",
        error: err.message
      });
    }
  });

export default BusRouter;