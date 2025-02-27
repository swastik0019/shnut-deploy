// import passport from "passport";
// import { Strategy as GoogleStrategy } from "passport-google-oauth20";
// import { User } from "../models/user.model.js"; // Import the User model
// import dotenv from "dotenv";

// dotenv.config();

// passport.use(
//   new GoogleStrategy(
//     {
//       clientID: process.env.GOOGLE_CLIENT_ID,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//       callbackURL: "/api/auth/google/callback",
//     },
//     async (accessToken, refreshToken, profile, done) => {
//       try {
//         let user = await User.findOne({ email: profile.emails[0].value });

//         if (!user) {
//           user = new User({
//             firstName: profile.name.givenName,
//             lastName: profile.name.familyName || "",
//             email: profile.emails[0].value,
//             avatar: profile.photos[0].value,
//             isVerified: true,
//             password: "", // No password needed for OAuth users
//           });

//           await user.save();
//         }

//         return done(null, user);
//       } catch (error) {
//         return done(error, null);
//       }
//     }
//   )
// );

// // Serialize and deserialize user
// passport.serializeUser((user, done) => {
//   done(null, user.id);
// });

// passport.deserializeUser(async (id, done) => {
//   try {
//     const user = await User.findById(id);
//     done(null, user);
//   } catch (error) {
//     done(error, null);
//   }
// });

// export default passport;
