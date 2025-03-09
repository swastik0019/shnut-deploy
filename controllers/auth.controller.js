import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User, validateUser } from "../models/user.model.js";
import generateToken from "../utils/generateToken.js";

// **Signup logic**
const register = async (req, res) => {
  try {
    // Set cache control headers
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
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
      gender,
    } = req.body;

    // Check if confirm password matches password
    if (password !== confirmPassword) {
      return res
        .status(400)
        .json({ error: "Password and confirm password do not match" });
    }

    // Check if the user already exists (by email)
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ error: "User already exists with this email" });
    }

    // Check if a user with the same nickname already exists
    const existingNickname = await User.findOne({ nickname });
    if (existingNickname) {
      return res
        .status(400)
        .json({ error: "User already exists with this nickname" });
    }

    // Validate gender field
    if (!gender || !["male", "female", "other"].includes(gender)) {
      return res
        .status(400)
        .json({ error: "Gender must be either male, female, or other" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

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
      gender,
      authType: "local", // Set auth type explicitly
    });

    // Save the user to the database
    await user.save();

    // Generate a JWT token
    let token = generateToken({ username: user.firstName, userId: user._id });

    // Set consistent cookie settings
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    // Respond with the user data and token
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
        gender: user.gender,
        isOnline: true,
      },
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// **Login Logic**
const login = async (req, res) => {
  try {
    // Set cache control headers to prevent caching
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    const { email, password } = req.body;

    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Compare the password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Generate token
    let token = generateToken({ username: user.firstName, userId: user._id });

    // Set the user online by updating the isOnline field
    user.isOnline = true;
    await user.save();

    // Use consistent cookie settings that match register
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days to match register
    });

    // Send a definitive 200 response with data
    res.status(200).json({
      message: "Login Successful",
      isAuthenticated: true,
      token,
      user: {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
        bio: user.bio,
        gender: user.gender,
        isOnline: true,
      }
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ error: "Internal server error", details: err.message });
  }
};

// **Logout logic**
const logout = async (req, res) => {
  try {
    // Set cache control headers
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // If the user is authenticated, update their online status
    if (req.user && req.user.id) {
      await User.findByIdAndUpdate(req.user.id, { isOnline: false });
    }

    // Clear the token cookie with same settings as it was set
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", 
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    res.status(200).json({ message: "Logout successful", isOnline: false });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// **Token Refresh**
const refreshToken = (req, res) => {
  // Set cache control headers
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ error: "Refresh token is required" });
  }

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Generate a new access token
    const accessToken = jwt.sign(
      { id: payload.id, role: payload.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({ accessToken });
  } catch (err) {
    console.error(err);
    res.status(403).json({ error: "Invalid refresh token" });
  }
};

// **Forgot Password Logic**
const forgotPassword = async (req, res) => {
  try {
    // Set cache control headers
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Generate reset token
    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    // TODO: Send reset token via email (e.g., using nodemailer)
    console.log(`Password reset token: ${resetToken}`);

    res.status(200).json({ message: "Password reset token sent to email" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// **Reset Password Logic**
const resetPassword = async (req, res) => {
  try {
    // Set cache control headers
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    const { resetToken, newPassword } = req.body;

    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Hash the new password
    user.password = await bcrypt.hash(newPassword, 10);

    // Save the updated user
    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
};