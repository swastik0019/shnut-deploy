import VideoChatSession from "../models/video.model.js";

// Create a new video chat session
const createVideoChatSession = async (req, res) => {
  try {
    const { room, participants, startedAt, endedAt, isActive, recordingUrl } = req.body;

    // Check if a session with this room already exists
    const existingSession = await VideoChatSession.findOne({ room });
    if (existingSession) {
      return res.status(400).json({ message: "Session with this room already exists" });
    }

    const session = new VideoChatSession({
      room,
      participants,
      startedAt,
      endedAt,
      isActive,
      recordingUrl,
    });

    const savedSession = await session.save();
    return res.status(201).json(savedSession);
  } catch (error) {
    console.error("Error creating video chat session:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Retrieve a video chat session by its room identifier
const getVideoChatSessionByRoom = async (req, res) => {
  try {
    const { room } = req.params;
    const session = await VideoChatSession.findOne({ room }).populate("participants.user", "firstName lastName email avatar");
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }
    return res.status(200).json(session);
  } catch (error) {
    console.error("Error retrieving video chat session:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Update an existing video chat session by its ID
const updateVideoChatSession = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const session = await VideoChatSession.findByIdAndUpdate(id, updateData, { new: true });
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }
    return res.status(200).json(session);
  } catch (error) {
    console.error("Error updating video chat session:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Delete a video chat session by its ID
const deleteVideoChatSession = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await VideoChatSession.findByIdAndDelete(id);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }
    return res.status(200).json({ message: "Session deleted successfully" });
  } catch (error) {
    console.error("Error deleting video chat session:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Add a participant to an existing video chat session
const addParticipant = async (req, res) => {
  try {
    const { room } = req.params;
    const { user } = req.body;

    if (!user) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const session = await VideoChatSession.findOne({ room });
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Prevent adding duplicate participants
    if (session.participants.some((p) => p.user.toString() === user)) {
      return res.status(400).json({ message: "Participant already exists in this session" });
    }

    session.participants.push({ user });
    await session.save();
    return res.status(200).json(session);
  } catch (error) {
    console.error("Error adding participant:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Remove a participant from a video chat session
const removeParticipant = async (req, res) => {
  try {
    const { room } = req.params;
    const { user } = req.body;

    if (!user) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const session = await VideoChatSession.findOne({ room });
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Filter out the specified participant
    session.participants = session.participants.filter((p) => p.user.toString() !== user);
    await session.save();
    return res.status(200).json(session);
  } catch (error) {
    console.error("Error removing participant:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export {
    createVideoChatSession,
    getVideoChatSessionByRoom,
    updateVideoChatSession,
    deleteVideoChatSession,
    addParticipant,
    removeParticipant
}