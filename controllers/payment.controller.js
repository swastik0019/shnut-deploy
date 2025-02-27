// import { createPayment } from "../services/payment.service.js";
// import { Payment, validatePayment } from "../models/payment.model.js";

// const createPaymentHandler = async (req, res) => {
//   try {
//     // Validate the request body using Joi
//     const { error } = validatePayment(req.body);
//     if (error) {
//       return res.status(400).json({ error: error.details[0].message });
//     }
//     const { amount, currency, receipt, userId, creatorId, subscriptionType } =
//       req.body;

//     // Create a Razorpay order
//     const order = await createPayment({ amount, currency, receipt });

//     // Save payment details in the DB with status "pending"
//     const paymentRecord = await Payment.create({
//       userId,
//       creatorId,
//       amount,
//       currency,
//       razorpayOrderId: order.id,
//       subscriptionType,
//       status: "pending",
//     });

//     res.status(200).json({ order, paymentId: paymentRecord._id });
//   } catch (error) {
//     console.error("Error creating payment:", error);
//     res.status(500).json({ error: error.message });
//   }
// };

// const verifyPaymentHandler = async (req, res) => {
//   try {
//     // Expecting these fields from the frontend
//     const {
//       razorpay_order_id,
//       razorpay_payment_id,
//       razorpay_signature,
//       paymentId,
//     } = req.body;
//     if (
//       !razorpay_order_id ||
//       !razorpay_payment_id ||
//       !razorpay_signature ||
//       !paymentId
//     ) {
//       return res.status(400).json({ error: "Missing parameters" });
//     }

//     // Generate expected signature using Razorpay key secret
//     const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
//     hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
//     const expectedSignature = hmac.digest("hex");

//     if (expectedSignature !== razorpay_signature) {
//       // Update payment record as failed if verification fails
//       await Payment.findByIdAndUpdate(paymentId, { status: "failed" });
//       return res.status(400).json({ error: "Invalid signature" });
//     }

//     // Update the payment record as completed
//     await Payment.findByIdAndUpdate(paymentId, {
//       status: "completed",
//       razorpayPaymentId: razorpay_payment_id,
//       razorpaySignature: razorpay_signature,
//     });

//     res.status(200).json({ message: "Payment verified successfully" });
//   } catch (error) {
//     console.error("Error verifying payment:", error);
//     res.status(500).json({ error: error.message });
//   }
// };

// const webhookHandler = async (req, res) => {
//   try {
//     // Retrieve the webhook secret and signature
//     const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
//     const signature = req.headers["x-razorpay-signature"];
//     const payload = JSON.stringify(req.body);

//     // Verify the webhook signature
//     const hmac = crypto.createHmac("sha256", webhookSecret);
//     hmac.update(payload);
//     const expectedSignature = hmac.digest("hex");

//     if (expectedSignature !== signature) {
//       return res.status(400).json({ error: "Invalid signature" });
//     }

//     // Process webhook events (example for payment capture)
//     const event = req.body;
//     if (event.event === "payment.captured") {
//       await Payment.findOneAndUpdate(
//         { razorpayOrderId: event.payload.payment.entity.order_id },
//         { status: "completed" }
//       );
//     }
//     // Process other events as needed

//     res.status(200).json({ message: "Webhook processed" });
//   } catch (error) {
//     console.error("Error processing webhook:", error);
//     res.status(500).json({ error: error.message });
//   }
// };

// export { createPaymentHandler, verifyPaymentHandler, webhookHandler };
