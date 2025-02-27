import { User } from "../models/user.model.js";

// **Follow a user**
// **POST /api/users/follow/:id**
const followUser = async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!userToFollow || !currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (currentUser.following.includes(userToFollow._id)) {
      return res.status(400).json({ message: "You are already following this user" });
    }

    currentUser.following.push(userToFollow._id);
    userToFollow.followers.push(currentUser._id);

    await currentUser.save();
    await userToFollow.save();

    res.status(200).json({ message: "User followed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// **Unfollow a user**
// **DELETE /api/users/unfollow/:id**
const unfollowUser = async (req, res) => {
  try {
    const userToUnfollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!userToUnfollow || !currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!currentUser.following.includes(userToUnfollow._id)) {
      return res.status(400).json({ message: "You are not following this user" });
    }

    currentUser.following = currentUser.following.filter(
      (id) => id.toString() !== userToUnfollow._id.toString()
    );

    userToUnfollow.followers = userToUnfollow.followers.filter(
      (id) => id.toString() !== currentUser._id.toString()
    );

    await currentUser.save();
    await userToUnfollow.save();

    res.status(200).json({ message: "User unfollowed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// **Get a user's followers
// **GET /api/users/followers/:id**
const getFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate("followers", "firstName lastName nickname avatar");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user.followers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// **Get a user's following list**
// **GET /api/users/following/:id**
const getFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate("following", "firstName lastName nickname avatar");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user.following);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export {
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing
}