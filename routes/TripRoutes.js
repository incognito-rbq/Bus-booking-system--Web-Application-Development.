import express from "express";
import Bus from "../models/BusSchema.js";
import User from "../models/UserSchema.js";
import Trip from "../models/TripSchema.js"
import Route from "../models/RouteSchema.js"
import jwtAuth from "../middleware/jwtAuth.middleware.js";

const TripRouter = express.Router();

const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      message: "Forbidden: Only admins can access this resource."
    });
  }
  next();
};

//Create Trip
TripRouter.post('/create',jwtAuth,isAdmin,async (req,res,)=>{
    try{
        const tripData=req.body;

        if(!tripData)
        {
            return res.status(400).json({message:"Bad Request: Trip data not provided."});
        }
        const bus = await Bus.findById(tripData.busId);
        if(!bus){
            return res.status(404).json({message:"Bus not found."});
        }
        const route = await Route.findById(tripData.routeId);
        if (!route) {
            return res.status(404).json({ message: "Route not found." });
        }

        const newTrip = new Trip(tripData);
        await newTrip.save();
        
        const populatedTrip = await Trip.findById(newTrip._id)
        .populate("busId", "busId driverId capacity")
        .populate("routeId", "routeId source destination");

        res.status(201).json({
        message: "Trip created successfully.",
        data: populatedTrip
        });
    }
    catch(err)
    {
        console.error("Error Creating Trip:",err);
        if (err.code === 11000) {
            return res.status(400).json({ message: "Trip ID already exists." });
        }
    
        res.status(500).json({ message: "Internal Server Error" });
    }
});

//Get All Trips
TripRouter.get("/all", async (req, res) => {
  try {
    const trips = await Trip.find({ status: "scheduled" })
      .populate("busId", "busId driverId capacity class")
      .populate("routeId", "routeId source destination")
      .sort({ departureTime: 1 });
    
    res.status(200).json({
      message: "Trips fetched successfully",
      count: trips.length,
      data: trips
    });
  } 
  catch (err)
{
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//Get Trips by ID
TripRouter.get("/:id", async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate("busId", "busId driverId capacity class")
      .populate("routeId", "routeId source destination");
    
    if (!trip) {
      return res.status(404).json({ message: "Trip not found." });
    }
    
    res.status(200).json({
      message: "Trip details fetched successfully",
      data: trip
    });
  } 
  catch (err) 
  {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//Get Trips by Bus ID
TripRouter.get("/bus/:busId", async (req, res) => {
  try {
    const trips = await Trip.find({ 
      busId: req.params.busId,
      status: "scheduled"
    })
      .populate("busId", "busId driverId capacity")
      .populate("routeId", "routeId source destination")
      .sort({ departureTime: 1 });
    
    res.status(200).json({
      message: "Trips fetched successfully",
      count: trips.length,
      data: trips
    });
  } 
  catch (err) 
  {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//Update Trip by ID
TripRouter.put("/update/:id", jwtAuth, isAdmin, async (req, res) => {
  try {
    const data = req.body;
    
    if (!data) {
      return res.status(400).json({ message: "No fields to update." });
    }
    
    const updatedTrip = await Trip.findByIdAndUpdate(
      req.params.id,
      data,
      { new: true }
    )
      .populate("busId", "busId driverId capacity")
      .populate("routeId", "routeId source destination");
    
    if (!updatedTrip) {
      return res.status(404).json({ message: "Trip not found." });
    }
    
    res.status(200).json({
      message: "Trip updated successfully",
      data: updatedTrip
    });
  } 
  catch (err) 
  {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//Cancel Trip by ID
TripRouter.put("/cancel/:id", jwtAuth, isAdmin, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    
    if (!trip) {
      return res.status(404).json({ message: "Trip not found." });
    }
    
    trip.status = "cancelled";
    await trip.save();
    
    res.status(200).json({
      message: "Trip cancelled successfully",
      data: trip
    });
  } 
  catch (err) 
  {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//Get Available Seats for a Trip
TripRouter.get("/:id/seats", async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate("busId", "busId seats capacity");
    
    if (!trip) {
      return res.status(404).json({ message: "Trip not found." });
    }
    
    const bus = trip.busId;
    const availableSeats = bus.seats.filter(seat => seat.isAvailable);
    const bookedSeats = bus.seats.filter(seat => !seat.isAvailable);
    
    res.status(200).json({
      message: "Seat availability fetched successfully",
      data: {
        tripId: trip._id,
        totalSeats: bus.capacity,
        availableSeats: availableSeats.length,
        bookedSeats: bookedSeats.length,
        seats: {
          available: availableSeats.map(s => s.seatNumber),
          booked: bookedSeats.map(s => s.seatNumber)
        }
      }
    });
  } 
  catch (err) 
  {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default TripRouter;