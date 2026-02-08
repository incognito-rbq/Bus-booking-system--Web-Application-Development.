import mongoose from 'mongoose';
const BusSchema= new mongoose.Schema({
    busId:{type:String, required:true,},
    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
    capacity:{type:Number, default:40},
    class:{type:String,enum:["standard","premium","gold"]},
    seats: [ {
          seatNumber: {type: Number,required: true},
          isAvailable: {type: Boolean,default: true},
        }
      ]

},{});

BusSchema.pre("save", function(next) {
    const bus = this;
    
if (bus.isNew || bus.isModified("capacity")) {
    bus.seats = [];
    
    for (let i = 1; i <= bus.capacity; i++) {
      bus.seats.push({
        seatNumber: i,
        isAvailable: true,
      });
    }
  };
});

BusSchema.methods.bookSeat = function (seatNumber) {
    const seat = this.seats.find(seat => seat.seatNumber === seatNumber);
  
    if (!seat) {
      return { success: false,message: "Seat not found" };
    }
    if (!seat.isAvailable) {
      return { success: false,  message: "Seat already booked" };
    }
   seat.isAvailable = false;
  
    return {
      success: true, message: "Seat booked successfully", seatNumber
    };
  };
  BusSchema.methods.cancelSeat = function (seatNumber) {
    const seat = this.seats.find(seat => seat.seatNumber === seatNumber);
  
    if (!seat) {
      return { success: false,message: "Seat not found" };
    }
    if (seat.isAvailable) {
      return { success: false,  message: "Seat already aaaavailable" };
    }
   seat.isAvailable = true;
  
    return {
      success: true, message: "Seat cancelled successfully", seatNumber
    };
  };
    
  const Bus = mongoose.model('Bus', BusSchema);

  export default Bus;
