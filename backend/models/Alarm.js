const mongoose = require('mongoose');

const alarmSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  location: {
    type: {
      type: String, 
      enum: ['Point'], 
      required: true
    },
    coordinates: {
      type: [Number],
      required: true // [longitude, latitude]
    }
  },
  radius: { type: Number, required: true }, // in meters
  isActive: { type: Boolean, default: true },
  triggeredAt: { type: Date }
}, { timestamps: true });

// Create 2dsphere index on location for geospatial queries
alarmSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Alarm', alarmSchema);
