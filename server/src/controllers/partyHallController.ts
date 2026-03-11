import { Request, Response } from 'express';
import { PartyHall } from '../models/PartyHall';
import { PartyBooking } from '../models/PartyBooking';
import { razorpay } from './paymentController';
import crypto from 'crypto';

export const getHallDetails = async (req: Request, res: Response) => {
    try {
        let hall = await PartyHall.findOne();
        if (!hall) {
            // Seed default hall if not exists
            hall = await PartyHall.create({
                name: "Zomoggy Grand Party Hall",
                description: "Premium venue for your special moments",
                capacityMin: 50,
                capacityMax: 150,
                pricePerEvent: 15000,
                pricePerPlate: 500,
                amenities: ["AC", "Sound System", "Decoration", "Catering", "Lighting"],
                images: [
                    "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=2098&auto=format&fit=crop",
                    "https://images.unsplash.com/photo-1464366400600-7168b8af0bc3?q=80&w=2069&auto=format&fit=crop",
                    "https://images.unsplash.com/photo-1530103862676-de3c9da59af7?q=80&w=2069&auto=format&fit=crop"
                ]
            });
        }
        res.json(hall);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const checkAvailability = async (req: Request, res: Response) => {
    try {
        const { date, timeSlot } = req.body;
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);

        const existingBooking = await PartyBooking.findOne({
            date: checkDate,
            timeSlot: timeSlot,
            status: { $in: ['Confirmed', 'Pending'] } // Assuming Pending blocks slot temporarily or we can allow double booking until paid? Let's block.
        });

        if (existingBooking) {
            res.json({ available: false, message: "Slot already booked" });
        } else {
            res.json({ available: true, message: "Slot available" });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const bookHall = async (req: any, res: Response) => {
    try {
        const {
            eventType, date, timeSlot, guestCount,
            cateringRequired, specialRequirements,
            contactInfo, tokenAmount
        } = req.body;

        const bookingDate = new Date(date);
        bookingDate.setHours(0, 0, 0, 0);

        // Double check availability
        const conflict = await PartyBooking.findOne({
            date: bookingDate,
            timeSlot,
            status: { $in: ['Confirmed'] }
        });

        if (conflict) {
            return res.status(400).json({ message: "Slot is no longer available." });
        }

        // Create Booking
        const booking = await PartyBooking.create({
            user: req.user._id,
            hall: (await PartyHall.findOne())?._id, // Attach to the single hall
            eventType,
            date: bookingDate,
            timeSlot,
            guestCount,
            cateringRequired,
            specialRequirements,
            contactInfo,
            totalAmount: tokenAmount, // For now, just tracking the token paid as "amount" essentially
            tokenAmountPaid: tokenAmount,
            status: 'Pending',
            paymentStatus: 'Pending'
        });

        // Initiate Razorpay Order for Token
        const options = {
            amount: tokenAmount * 100, // paise
            currency: 'INR',
            receipt: `party_${booking._id}`,
            notes: {
                bookingId: booking._id.toString(),
                type: 'PARTY_HALL_TOKEN'
            }
        };

        const razorpayOrder = await razorpay.orders.create(options);

        booking.paymentId = razorpayOrder.id;
        await booking.save();

        res.status(201).json({
            booking,
            razorpayOrder
        });

    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const verifyBookingPayment = async (req: Request, res: Response) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

        const generated_signature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder')
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest('hex');

        if (generated_signature === razorpay_signature) {
            const booking = await PartyBooking.findById(bookingId);
            if (booking) {
                booking.paymentStatus = 'Paid';
                booking.status = 'Confirmed';
                booking.paymentId = razorpay_payment_id;
                await booking.save();

                // FUTURE: Send Confirmation Notification/Email here

                res.json({ success: true, message: "Payment verified and Booking Confirmed", booking });
            } else {
                res.status(404).json({ success: false, message: "Booking not found" });
            }
        } else {
            res.status(400).json({ success: false, message: "Invalid signature" });
        }
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
