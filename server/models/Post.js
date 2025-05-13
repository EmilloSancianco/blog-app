const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  commenter: {
    type: String,
    required: true
  },
  comment: {
    type: String,
    required: true
  },
  commentedAt: {
    type: Date,
    default: Date.now
  }
});

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  author: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: true
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  comments: [commentSchema]
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
