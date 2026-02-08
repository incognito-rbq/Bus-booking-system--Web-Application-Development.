import express from "express";
import dotenv from "dotenv";
dotenv.config();
import passport from "passport";
import db from "./db.js";
import userRouter from "./routes/UserRoutes.js";
import BusRouter from "./routes/BusRoutes.js";
import TripRouter from "./routes/TripRoutes.js";
import RouteRouter from "./routes/RouteRoutes.js";
import ticketRouter from "./routes/TicketRoutes.js";

const app = express();


app.use(express.json());
app.use(passport.initialize());
app.use('/api/user', userRouter);
app.use('/api/bus',BusRouter );
app.use('/api/trip',TripRouter );
app.use('/api/ticket',ticketRouter );
app.use('/api/route',RouteRouter );

const port=3000;
app.listen(port, () => {
    console.log(`Server Active on port:${port}`);
});

export default app;