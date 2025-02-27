// import Razorpay from 'razorpay';

// const razorpayInstance = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_KEY_SECRET,
// });

// const createPayment = async ({ amount, currency = 'INR', receipt = 'receipt#1' }) => {
//   const options = {
//     amount: amount * 100, // converting to paise if amount is in INR
//     currency,
//     receipt,
//     payment_capture: 1, // automatic capture
//   };

//   const order = await razorpayInstance.orders.create(options);
//   return order;
// };

// export { createPayment }