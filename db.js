import mongoose from "mongoose";

const mongoURL = "mongodb://localhost:27017/BusBookingSystem";

mongoose.connect(mongoURL);

const db = mongoose.connection;

db.on('connected', () => console.log('Database is connected'));
db.on('disconnected', () => console.log('Database is disconnected'));
db.on('error', (error) => console.error('Error: ', error));

export default db;