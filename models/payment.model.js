import mongoose from "mongoose";
import Joi from "joi";

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "INR",
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    razorpayOrderId: {
      type: String,
      required: true,
    },
    razorpayPaymentId: {
      type: String,
    },
    razorpaySignature: {
      type: String,
    },
    // subscriptionType: {
    //   type: String,
    //   enum: ["one-time", "monthly", "yearly"],
    //   required: true,
    // },
    expiryDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

const Payment = mongoose.model("Payment", paymentSchema);

const validatePayment = (data) => {
  const schema = Joi.object({
    userId: Joi.string().required(),
    creatorId: Joi.string().required(),
    amount: Joi.number().required(),
    currency: Joi.string(),
    status: Joi.string().valid("pending", "completed", "failed"),
    razorpayOrderId: Joi.string().required(),
    razorpayPaymentId: Joi.string().optional(),
    razorpaySignature: Joi.string().optional(),
    subscriptionType: Joi.string().valid("one-time", "monthly", "yearly").required(),
    expiryDate: Joi.date().optional(),
  });
  return schema.validate(data);
};

export { Payment, validatePayment };