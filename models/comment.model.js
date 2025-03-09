import mongoose from "mongoose";
import Joi from "joi";

const commentSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    isDeleted: {
      type: Boolean,
      default: false
    },
    // Add this to track if content was edited
    isEdited: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// Create a virtual property to get reply count
commentSchema.virtual('replyCount').get(function() {
  return this.replies ? this.replies.length : 0;
});

// Create a virtual property to get like count
commentSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Set toJSON option to include virtuals
commentSchema.set('toJSON', { virtuals: true });
commentSchema.set('toObject', { virtuals: true });

// Enhanced Joi validation schema for comments
const validateComment = (comment) => {
  const schema = Joi.object({
    post: Joi.string().required().messages({
      'string.empty': 'Post ID is required',
      'any.required': 'Post ID is required'
    }),
    user: Joi.string().required().messages({
      'string.empty': 'User ID is required',
      'any.required': 'User ID is required'
    }),
    content: Joi.string().required().max(1000).messages({
      'string.empty': 'Comment content is required',
      'string.max': 'Comment cannot exceed 1000 characters',
      'any.required': 'Comment content is required'
    }),
    parentComment: Joi.string().allow(null, '').optional()
  });
  return schema.validate(comment, { abortEarly: false });
};

const commentModel = mongoose.model("Comment", commentSchema);

export { commentModel, validateComment };