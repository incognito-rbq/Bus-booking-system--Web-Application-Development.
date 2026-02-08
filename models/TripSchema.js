import mongoose from "mongoose";

const tripSchema = new mongoose.Schema({
  busId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Bus",
    required: true,
  },
  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Route",
    required: true,
  },
  departureTime: {
    type: Date,
    required: true,
    validate: {
      validator: function(value) {
        return value > new Date();
      },
      message: "Departure time must be in the future"
    }
  },
  arrivalTime: {
    type: Date,
    required: true,
    validate: {
      validator: function(value) {
        return value > this.departureTime;
      },
      message: "Arrival time must be after departure time"
    }
  },
  pricePerSeat: {
    type: Number,
    required: true,
    min: 0,
  },
  availableSeats: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ["scheduled", "ongoing", "completed", "cancelled"],
    default: "scheduled"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
},{ timestamps: true });

//Set Available Seats Before Saving Trip Data
tripSchema.pre('save', async function() {
  if (this.isNew) {
    const Bus = mongoose.model('Bus');
    const bus = await Bus.findById(this.busId);
    
    if (bus) {
      this.availableSeats = bus.capacity;
    }
  }
});



const Trip = mongoose.model("Trip", tripSchema);

export default Trip;
