// src/routes/payment.js
import express from "express";
import { createPaymentHandler, verifyPaymentHandler, webhookHandler } from "../controllers/payment.controller.js";

const router = express.Router();

// Endpoint for creating a new order
router.post("/order", createPaymentHandler);

// Endpoint for verifying payment details
router.post("/verify", verifyPaymentHandler);

// Webhook endpoint for asynchronous Razorpay events
// Use express.raw middleware for this route if necessary
router.post("/webhook", express.raw({ type: "application/json" }), webhookHandler); //--> to be integrated in future

export default router;
