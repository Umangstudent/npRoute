require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const alarmRoutes = require('./routes/alarmRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use('/api/alarms', alarmRoutes);

app.get('/', (req, res) => {
    res.send('NapRoute API is running');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
