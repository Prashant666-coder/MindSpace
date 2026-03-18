/**
 * Mood Model
 * Tracks user mood entries with emotion type, intensity, and notes.
 * Used for mood analytics and history tracking.
 */

const mongoose = require('mongoose');

const moodSchema = new mongoose.Schema({
  // Reference to the user who logged this mood
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Primary emotion: happy, sad, stressed, angry, calm, anxious
  emotion: {
    type: String,
    required: [true, 'Emotion is required'],
    enum: ['happy', 'sad', 'stressed', 'angry', 'calm', 'anxious'],
    lowercase: true
  },
  // Intensity of the mood on a scale of 1–10
  intensity: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
    default: 5
  },
  // Optional note about what caused this mood
  note: {
    type: String,
    trim: true,
    maxlength: 500,
    default: ''
  },
  // Timestamp of the mood entry
  date: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient querying by user and date
moodSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('Mood', moodSchema);
