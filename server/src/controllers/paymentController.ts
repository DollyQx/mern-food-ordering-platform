import { Request, Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';

export const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder',
});

// @desc    Create Razorpay Order
// @route   POST /api/payment/create-order
// @access  Private
export const createPaymentOrder = async (req: Request, res: Response) => {
    try {
        const { amount } = req.body;

        const options = {
            amount: Math.round(amount * 100), // amount in smallest currency unit (paise)
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);

        res.json(order);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const verifyPaymentSignature = (
    razorpay_order_id: string,
    razorpay_payment_id: string,
    razorpay_signature: string
) => {
    const key_secret = process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder';
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
        .createHmac('sha256', key_secret)
        .update(body.toString())
        .digest('hex');

    return expectedSignature === razorpay_signature;
};

// @desc    Handle Razorpay Webhook
// @route   POST /api/payment/webhook
// @access  Public (Signature Verified)
export const handleWebhook = async (req: Request, res: Response) => {
    try {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

        // If no secret is defined, we can't verify. Secure fail.
        if (!secret) {
            console.error('RAZORPAY_WEBHOOK_SECRET not set');
            res.status(500).json({ message: 'Server misconfiguration' });
            return;
        }

        const signature = req.headers['x-razorpay-signature'] as string;

        if (!signature) {
            res.status(400).json({ message: 'Missing signature' });
            return;
        }

        const body = JSON.stringify(req.body);

        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(body)
            .digest('hex');

        if (expectedSignature !== signature) {
            console.error('Invalid Webhook Signature');
            res.status(400).json({ message: 'Invalid signature' });
            return;
        }

        const event = req.body.event;
        const payload = req.body.payload;

        console.log(`Webhook Received: ${event}`);

        if (event === 'payment.captured') {
            const payment = payload.payment.entity;
            const orderId = payment.order_id; // Razorpay Order ID

            // Update Order Status in DB
            // We need to find the order by 'transactionId' or store razorpay_order_id in our DB.
            // Currently our Order model has 'transactionId' which usually stores payment_id.
            // But when creating order via Razorpay, we get an 'id' (order_id) which we should probably store.

            // However, typical flow: 
            // 1. Create Order (server) -> Get RZP_ORDER_ID
            // 2. Frontend pays -> Success
            // 3. Frontend calls /place-order -> details sent to server.

            // If Frontend fails at step 3, we have a loose Payment but no Order in DB yet?
            // OR do we create Order in DB as "Pending" first? 

            // Looking at 'placeOrder' controller:
            // It runs AFTER payment success on client.

            // If we want Webhook to update status, the Order must exist in DB.
            // If the Order doesn't exist (because frontend failed to call placeOrder),
            // then we have a "dangling payment".

            // For now, let's assume we might need to handle "payment.captured" for an existing order 
            // that might be stuck in "Pending" payment status if we had that flow.
            // But currently 'placeOrder' creates the order as 'Paid' immediately if valid.

            // So Webhook is mostly useful if we implement a flow where Order is created BEFORE payment.
            // OR if we want to log the payment independent of Order.

            // Given current architecture: "placeOrder" handles everything.
            // Webhook might just be for redundancy or logging for now unless we refactor.

            // But let's verify if we can find an order by some metadata.
            // Razorpay allows sending 'notes'. We could put our internal OrderID in notes if we created it first.

            // Since we don't create DB Order first, we can't strictly update it here unless we change flow.
            // BUT, if the user mentioned they want webhook, maybe they faced issues where money is cut but order not placed?

            // In that case, we need to create the order here? We don't have cart items here!

            // PROPOSAL: Just log for now, or check if we can match by email/phone from payment entity if available.

            console.log('Payment captured for order_id:', orderId);

            // If we decide to move to "Create Order Pending -> Pay -> Webhook Update", 
            // we would need to change createPaymentOrder to also create a DB Order.

            // For this task, I will implement the validation and logging.
            // Actual DB update depends on finding the order. 
            // Our Order model seems to lack 'razorpayOrderId' field explicitly searched.
            // Although 'transactionId' is used for paymentId.

            // Let's try to find if any order has this razorpay_order_id in paymentDetails (if we stored it).
            // Current Order model:
            /*
            paymentDetails: {
               razorpay_payment_id: { type: String },
               razorpay_order_id: { type: String },
               razorpay_signature: { type: String }
           },
            */

            // So we CAN find the order!
            const Order = (await import('../models/Order')).Order;
            const order = await Order.findOne({ 'paymentDetails.razorpay_order_id': orderId });

            if (order) {
                if (order.paymentStatus !== 'Paid') {
                    order.paymentStatus = 'Paid';
                    order.transactionId = payment.id; // Update payment ID if needed
                    await order.save();
                    console.log(`Order ${order._id} marked as Paid via Webhook`);
                } else {
                    console.log(`Order ${order._id} is already Paid`);
                }
            } else {
                console.warn(`Order not found for Razorpay Order ID: ${orderId}`);
                // This confirms "Dangling Payment" - Money cut, no Order in DB.
                // We should log this to a special file called 'dangling_payments.json' so Admin can refund or manual process.

                const fs = await import('fs');
                const path = await import('path');
                const logDir = path.join(__dirname, '../../fatal_logs');
                if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

                const logFile = path.join(logDir, 'dangling_payments.json');
                const entry = {
                    timestamp: new Date().toISOString(),
                    razorpay_order_id: orderId,
                    razorpay_payment_id: payment.id,
                    amount: payment.amount,
                    email: payment.email,
                    contact: payment.contact,
                    method: payment.method
                };

                let logs = [];
                if (fs.existsSync(logFile)) {
                    try { logs = JSON.parse(fs.readFileSync(logFile, 'utf8')); } catch (e) { }
                }
                logs.push(entry);
                fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
            }
        }

        else if (event === 'payment.failed') {
            const payment = payload.payment.entity;
            const orderId = payment.order_id;

            const Order = (await import('../models/Order')).Order;
            const order = await Order.findOne({ 'paymentDetails.razorpay_order_id': orderId });

            if (order) {
                order.paymentStatus = 'Failed';
                await order.save();
                console.log(`Order ${order._id} marked as Failed via Webhook`);
            }
        }

        res.json({ status: 'ok' });
    } catch (error: any) {
        console.error('Webhook Error:', error);
        res.status(500).json({ message: error.message });
    }
};
