/**
 * Journal Model
 * Stores personal journal/diary entries for users.
 * Supports title, content, mood tagging, and timestamps.
 */

const mongoose = require('mongoose');

const journalSchema = new mongoose.Schema({
  // Reference to the journal owner
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Journal entry title
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: 200
  },
  // Main content of the journal entry
  content: {
    type: String,
    required: [true, 'Content is required'],
    trim: true,
    maxlength: 5000
  },
  // Optional mood tag associated with this entry
  mood: {
    type: String,
    enum: ['happy', 'sad', 'stressed', 'angry', 'calm', 'anxious', 'grateful', 'hopeful', ''],
    default: ''
  },
  // Creation timestamp
  createdAt: {
    type: Date,
    default: Date.now
  },
  // Last updated timestamp
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
journalSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient querying
journalSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Journal', journalSchema);
