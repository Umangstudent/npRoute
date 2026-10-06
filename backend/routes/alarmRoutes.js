const express = require('express');
const router = express.Router();
const Alarm = require('../models/Alarm');

// Create a new alarm
router.post('/', async (req, res) => {
  try {
    const { name, description, longitude, latitude, radius } = req.body;
    
    const newAlarm = new Alarm({
      name,
      description,
      location: {
        type: 'Point',
        coordinates: [longitude, latitude] // Note: MongoDB expects [longitude, latitude]
      },
      radius
    });

    const savedAlarm = await newAlarm.save();
    res.status(201).json(savedAlarm);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all active alarms
router.get('/', async (req, res) => {
  try {
    const alarms = await Alarm.find({ isActive: true });
    res.status(200).json(alarms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check if current location triggers any alarms
router.post('/check', async (req, res) => {
  try {
    const { longitude, latitude } = req.body;

    // Use $geoNear in aggregation to calculate distance and check if within radius
    const nearbyAlarms = await Alarm.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [longitude, latitude] },
          distanceField: 'distance',
          spherical: true,
          query: { isActive: true }
        }
      },
      {
        // Add a condition to match only if distance <= radius
        $match: {
          $expr: { $lte: ['$distance', '$radius'] }
        }
      }
    ]);

    // Mark triggered alarms as inactive
    if (nearbyAlarms.length > 0) {
        const alarmIds = nearbyAlarms.map(a => a._id);
        await Alarm.updateMany(
            { _id: { $in: alarmIds } }, 
            { isActive: false, triggeredAt: new Date() }
        );
    }

    res.status(200).json(nearbyAlarms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
