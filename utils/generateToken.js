import jwt from "jsonwebtoken";
import { JWT_EXP } from "../constants.js";

const generateToken = (data) => {
  try {
    // Ensure JWT_SECRET is available
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET environment variable is not set.");
    }

    // Generate the token with an expiration time and the secret
    return jwt.sign(data, process.env.JWT_SECRET, { expiresIn: JWT_EXP });
  } catch (error) {
    console.error("Error generating JWT:", error);
    throw error; // Rethrow or handle as needed
  }
};

export default generateToken;