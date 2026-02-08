import mongoose from "mongoose";
import bcrypt from "bcrypt";


const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: [2, "Name is too short"],
    maxlength: [50, "Name is too long"],
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      "Please use a valid email address",
    ],
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    match: [/^\+?[0-9]{10,15}$/, "Invalid phone number"],
  },
  password: {
    type: String,
    required: true,
    minlength: [8, "Password should be at least 8 characters long"],
    match: [
      /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&*!\-+=])(?=\S+$).{8,80}$/,
      "Password must contain at least one number, one lowercase letter, one uppercase letter, and one special character",
    ],
  },
  age: {
    type: Number,
    min: [18, "Minimum age is 18"],
    required: true,
  },
  gender: {
    type: String,
    enum: ["male", "female"],
    lowercase: true,
    required: true,
  },
  role: {
    type: String,
    enum: ["customer", "driver", "admin"],
    required: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
});

userSchema.pre("save", async function () {
  const user = this;
  
  if (!user.isModified("password")) {
    return; 
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(user.password, salt);
    user.password = hashedPassword;
    user.isVerified = true;
  } 
  catch (err) {
    throw err; 
  }
});

userSchema.pre("insertMany", async function (docs) {
  if (!Array.isArray(docs) || docs.length === 0) {
    return;
  }

  try {
    for (const doc of docs) {
      if (doc.password) {
        const salt = await bcrypt.genSalt(10);
        doc.password = await bcrypt.hash(doc.password, salt);
        doc.isVerified = true;
      }
    }
  } catch (err) {
    throw err;
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return bcrypt.compare(candidatePassword, this.password);
  } 
  catch (err) {
    throw err;
  }
};

const User = mongoose.model("User", userSchema);

export default User;