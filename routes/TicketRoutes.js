import express from "express";
import Ticket from "../models/TicketSchema.js";
import Trip from "../models/TripSchema.js";
import jwtAuth from "../middleware/jwtAuth.middleware.js";

const ticketRouter = express.Router();

// Create a Ticket
ticketRouter.post('/create', jwtAuth, async (req, res) => {
    try {
        const { tripId, seatNumbers } = req.body;
        const userId = req.user._id;

        if (!tripId || !seatNumbers || seatNumbers.length === 0) {
            return res.status(400).json({ msg: "Bad Request: Trip ID and Seat Numbers are required." });
        }

        const trip = await Trip.findById(tripId);
        if (!trip) {
            return res.status(404).json({ msg: "Trip not found." });
        }

        const existingBooking = await Ticket.findOne({
            tripId: tripId,
            seatNumbers: { $in: seatNumbers }, 
            status: "booked"
        });

        if (existingBooking) {
            return res.status(409).json({
                msg: "One or more of selected seats are already booked. Please choose different seats."
            });
        }

        const totalPrice = trip.pricePerSeat * seatNumbers.length;

        const ticket = new Ticket({
            userId,
            tripId,
            seatNumbers,
            totalPrice,
            status: "booked"
        });

        await ticket.save();

        res.status(201).json({
            msg: "Ticket created successfully!",
            data: ticket
        });

    } catch (err) {
        console.error("Ticket creation error:", err);
        res.status(500).json({
            msg: "Internal Server Error",
            error: err.message,
        });
    }
});

// View User's Tickets
ticketRouter.get('/view', jwtAuth, async (req, res) => {
    try {
        const userId = req.user._id;

        const tickets = await Ticket.find({ userId: userId }).populate("tripId");

        if (!tickets || tickets.length === 0) {
            return res.status(404).json({ msg: "No tickets found for this user. 🤷‍♂️" });
        }

        res.status(200).json({
            msg: `Found ${tickets.length} ticket(s)`,
            data: tickets
        });

    } catch (err) {
        res.status(500).json({
            msg: "Internal Server Error",
            error: err.message,
        });
    }
});

// Cancel a Ticket
ticketRouter.put('/cancel/:id', jwtAuth, async (req, res) => {
    try {
        const ticketId = req.params.id;
        const userId = req.user._id;

        const ticket = await Ticket.findOne({ _id: ticketId, userId: userId });

        if (!ticket) {
            return res.status(404).json({ msg: "Ticket not found or unauthorized." });
        }

        if (ticket.status === "cancelled") {
            return res.status(400).json({ msg: "Ticket is already cancelled!" });
        }

        ticket.status = "cancelled";
        await ticket.save();

        res.status(200).json({
            msg: "Ticket cancelled successfully.",
            data: ticket
        });

    } catch (err) {
        res.status(500).json({
            msg: "Internal Server Error",
            error: err.message,
        });
    }
});

// Refund a Ticket
ticketRouter.put('/refund/:id', jwtAuth, async (req, res) => {
    try {
        const ticketId = req.params.id;
        const userId = req.user._id;

        const ticket = await Ticket.findOne({ _id: ticketId, userId: userId });

        if (!ticket) {
            return res.status(404).json({ msg: "Ticket not found or unauthorized." });
        }

        if (ticket.status !== "cancelled") {
            return res.status(400).json({ msg: "You must cancel the ticket before refunding." });
        }

        ticket.status = "refunded";
        await ticket.save();

        res.status(200).json({
            msg: "Ticket refunded successfully.",
            data: ticket
        });

    } catch (err) {
        res.status(500).json({
            msg: "Internal Server Error",
            error: err.message,
        });
    }
});

export default ticketRouter;