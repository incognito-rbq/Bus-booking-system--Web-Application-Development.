import mongoose from "mongoose";

const routeSchema = new mongoose.Schema({
  routeId: {
    type: String,
    required: true,
    unique: true
  },
  source: {
    type: String,
    required: true
  },
  destination: {
    type: String,
    required: true
  },
  distance: {
    type: Number,
    required: true,
    min: 1
  },
  estimatedDuration: {
    type: Number, 
    required: true,
    min: 1
  },
  stops: [{
    name: String,
    arrivalTime: String, 
    sequence: Number
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Route = mongoose.model("Route", routeSchema);

export default Route;