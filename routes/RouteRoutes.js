import express from "express";
import jwtAuth from "../middleware/jwtAuth.middleware.js";
import Route from "../models/RouteSchema.js";
import e from "express";

const RouteRouter = express.Router();

const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ 
      message: "Forbidden: Only admins can access this resource." 
    });
  }
  next();
};

// Create Route
RouteRouter.post("/create", jwtAuth, isAdmin, async (req, res) => {
  try{
    const data = req.body;
    
    if (!data) {
      return res.status(400).json({ message: "Route data not provided." });
    }
    
    const newRoute = new Route(data);
    await newRoute.save();
    
    res.status(201).json({
      message: "Route created successfully.",
      data: newRoute
    });
  } 
  catch (err) 
  {
    console.error("Create Route Error:", err);
    
    if (err.code === 11000) {
      return res.status(400).json({ message: "Route ID already exists." });
    }
    
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get All Routes
RouteRouter.get("/all", async (req, res) => {
  try{
    const routes = await Route.find({ isActive: true });
    
    res.status(200).json({
      message: "Routes fetched successfully",
      count: routes.length,
      data: routes
    });
  } 
  catch (err) 
  {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get Route by ID
RouteRouter.get("/:id", async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    
    if (!route) {
      return res.status(404).json({ message: "Route not found." });
    }
    
    res.status(200).json({
      message: "Route details fetched successfully",
      data: route
    });
  } 
  catch (err) 
  {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Update Route
RouteRouter.put("/update/:id", jwtAuth, isAdmin, async (req, res) => {
  try {
    const data = req.body;
    
    if (!data) {
      return res.status(400).json({ message: "No fields to update." });
    }
    
    const updatedRoute = await Route.findByIdAndUpdate(
      req.params.id,
      data,
      { new: true }
    );
    
    if (!updatedRoute) {
      return res.status(404).json({ message: "Route not found." });
    }
    
    res.status(200).json({
      message: "Route updated successfully",
      data: updatedRoute
    });
  } 
  catch (err) 
  {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Delete Route 
RouteRouter.delete("/delete/:id", jwtAuth, isAdmin, async (req, res) => {
  try {
    const deletedRoute = await Route.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!deletedRoute) {
      return res.status(404).json({ message: "Route not found." });
    }
    
    res.status(200).json({
      message: "Route deleted successfully",
      data: deletedRoute
    });
  } 
  catch (err) 
  {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Search Routes by Source
RouteRouter.get("/search/source/:source", async (req, res) => {
  try {
    const routes = await Route.find({
      source: { $regex: req.params.source, $options: 'i' },
      isActive: true
    });
    
    res.status(200).json({
      message: "Routes found",
      count: routes.length,
      data: routes
    });
  } 
  catch (err) 
  {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default RouteRouter;