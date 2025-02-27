import bcrypt from "bcrypt"; // Import bcrypt for password hashing
import jwt from "jsonwebtoken"; // Import jsonwebtoken for token generation
import { User, validateUser } from "../models/user.model.js"; // Import User model and validation function
import generateToken from "../utils/generateToken.js";

// **Signup logic**
const register = async (req, res) => {
  try {
    // Validate the request body
    const { error } = validateUser(req.body);
    if (error) {
      return res
        .status(400)
        .json({ errors: error.details.map((err) => err.message) });
    }

    const {
      firstName,
      lastName,
      nickname,
      email,
      password,
      confirmPassword,
      avatar,
      bio,
      role,
    } = req.body;

    // Check if confirm password matches password
    if (password !== confirmPassword) {
      return res
        .status(400)
        .json({ error: "Password and confirm password do not match" }); // Return error if passwords do not match
    }

    // Check if the user already exists (by email)
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ error: "User already exists with this email" }); // Return error if user exists by email
    }

    // Optionally, check if a user with the same nickname already exists
    const existingNickname = await User.findOne({ nickname });
    if (existingNickname) {
      return res
        .status(400)
        .json({ error: "User already exists with this nickname" }); // Return error if nickname is taken
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10); // Hash the password with bcrypt

    // Create a new user instance, including nickname
    const user = new User({
      firstName,
      lastName,
      nickname,
      email,
      password: hashedPassword,
      avatar,
      bio,
      role,
    });

    // Save the user to the database
    await user.save(); // Save the new user

    // Generate a JWT token
    let token = generateToken({ username: user.firstName, userId: user._id });

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      // secure: false,
      sameSite: "none",
      // sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    // Respond with the user data and token (include nickname in the response)
    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        nickname: user.nickname,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
      },
      token, // Return the generated token
    });
  } catch (err) {
    console.error(err); // Log any errors
    res.status(500).json({ error: "Internal server error" }); // Return internal server error
  }
};

// **Login Logic**
const login = async (req, res) => {
  try {
    const { email, password } = req.body; // Extract email and password from request body

    // Check if the user exists
    const user = await User.findOne({ email }); // Look for user by email
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" }); // Return error if user not found
    }

    // Compare the password
    const isMatch = await bcrypt.compare(password, user.password); // Compare provided password with stored hashed password
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" }); // Return error if passwords do not match
    }

    if (isMatch) {
      let token = generateToken({ username: user.firstName, userId: user._id });
      // console.log(token)

      res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        // secure: false,
        sameSite: "none",
        // sameSite: "strict",
        maxAge: 3600000,
      });

      console.log("Login Successful");
      res.status(200).json({
        message: "Login Successful",
        isAuthenticated: true,
        token,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
        bio: user.bio,
      });
      console.log(req.cookies);
    } else {
      return res.status(500).json({
        isAuthenticated: false,
      });
    }
  } catch (err) {
    console.error(err); // Log any errors
    res.status(500).json({ error: "Internal server error" }); // Return internal server error
  }
};

// **Logout logic**
const logout = (_, res) => {
  // If storing the token in cookies
  res.clearCookie("token"); // Clear the token cookie

  res.status(200).json({ message: "Logout successful" }); // Return success message
  console.log("Logout successful");
};

// **Token Refresh**
const refreshToken = (req, res) => {
  const { refreshToken } = req.body; // Extract refresh token from request body

  if (!refreshToken) {
    return res.status(401).json({ error: "Refresh token is required" }); // Return error if refresh token is missing
  }

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET); // Verify the refresh token

    // Generate a new access token
    const accessToken = jwt.sign(
      { id: payload.id, role: payload.role }, // Payload for the new token
      process.env.JWT_SECRET, // Secret key from environment variables
      { expiresIn: "1h" } // Token expiration time
    );

    res.status(200).json({ accessToken }); // Return the new access token
  } catch (err) {
    console.error(err); // Log any errors
    res.status(403).json({ error: "Invalid refresh token" }); // Return error if refresh token is invalid
  }
};

// **Forgot Password Logic**
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body; // Extract email from request body

    const user = await User.findOne({ email }); // Look for user by email
    if (!user) {
      return res.status(404).json({ error: "User not found" }); // Return error if user not found
    }

    // Generate reset token
    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "15m", // Token expiration time
    });

    // TODO: Send reset token via email (e.g., using nodemailer)
    console.log(`Password reset token: ${resetToken}`); // Log the reset token for debugging

    res.status(200).json({ message: "Password reset token sent to email" }); // Return success message
  } catch (err) {
    console.error(err); // Log any errors
    res.status(500).json({ error: "Internal server error" }); // Return internal server error
  }
};

// **Reset Password Logic**
const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body; // Extract reset token and new password from request body

    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET); // Verify the reset token

    const user = await User.findById(decoded.id); // Find user by ID from the decoded token
    if (!user) {
      return res.status(404).json({ error: "User not found" }); // Return error if user not found
    }

    // Hash the new password
    user.password = await bcrypt.hash(newPassword, 10); // Hash the new password

    // Save the updated user
    await user.save(); // Save the updated user

    res.status(200).json({ message: "Password reset successful" }); // Return success message
  } catch (err) {
    console.error(err); // Log any errors
    res.status(500).json({ error: "Internal server error" }); // Return internal server error
  }
};

export { register, login, logout, refreshToken, forgotPassword, resetPassword };
