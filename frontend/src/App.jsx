import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_URL = rawApiUrl.endsWith('/api/alarms')
  ? rawApiUrl
  : `${rawApiUrl.replace(/\/$/, '')}/api/alarms`;

function App() {
  const [location, setLocation] = useState(null);
  const [alarms, setAlarms] = useState([]);
  const [triggeredAlarms, setTriggeredAlarms] = useState([]);
  const [isRinging, setIsRinging] = useState(false);
  const [ringingMessage, setRingingMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    latitude: '',
    longitude: '',
    radius: ''
  });

  const audioCtxRef = useRef(null);
  const intervalRef = useRef(null);

  // Play a loud double-pulse alarm beep
  const playBeep = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(659, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.38);
    } catch (e) {
      console.error('Audio play error:', e);
    }
  };

  // Start continuous alarm sound & vibration
  const triggerAlarmSound = (message) => {
    setRingingMessage(message);
    setIsRinging(true);

    if (!intervalRef.current) {
      playBeep();
      intervalRef.current = setInterval(playBeep, 450);
    }

    if ('vibrate' in navigator) {
      navigator.vibrate([500, 250, 500, 250, 500]);
    }
  };

  // Stop alarm sound
  const handleStopAlarm = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if ('vibrate' in navigator) {
      navigator.vibrate(0);
    }
    setIsRinging(false);
    setRingingMessage('');
  };

  // Fetch active alarms
  const fetchAlarms = async () => {
    try {
      const response = await axios.get(API_URL);
      setAlarms(response.data);
    } catch (error) {
      console.error('Error fetching alarms:', error);
    }
  };

  useEffect(() => {
    fetchAlarms();
  }, []);

  // Track user location
  useEffect(() => {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by your browser');
      return;
    }

    const watcher = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude });

        // Check if current location triggers any alarms
        try {
          const response = await axios.post(`${API_URL}/check`, { latitude, longitude });
          if (response.data.length > 0) {
            setTriggeredAlarms((prev) => [...prev, ...response.data]);
            const names = response.data.map((a) => a.name).join(', ');
            triggerAlarmSound(`You entered the radius of ${names}!`);
            fetchAlarms(); // refresh active alarms list
          }
        } catch (error) {
          console.error('Error checking alarms:', error);
        }
      },
      (error) => console.error('Error getting location:', error),
      { enableHighAccuracy: true, maximumAge: 0 }
    );

    return () => {
      navigator.geolocation.clearWatch(watcher);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const setLocationToCurrent = () => {
    if (location) {
      setFormData((prev) => ({
        ...prev,
        latitude: location.latitude,
        longitude: location.longitude
      }));
    } else {
      alert('Current location not available yet. Please allow location permission.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(API_URL, {
        name: formData.name,
        description: formData.description,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        radius: parseInt(formData.radius, 10)
      });
      fetchAlarms();
      setFormData({ name: '', description: '', latitude: '', longitude: '', radius: '' });
      alert('Alarm created successfully!');
    } catch (error) {
      console.error('Error creating alarm:', error);
      alert(`Error creating alarm: ${error.response?.data?.error || error.message}`);
    }
  };

  return (
    <div className="App">
      {/* Loud Ringing Modal Banner */}
      {isRinging && (
        <div className="alarm-overlay">
          <div className="alarm-modal">
            <div className="siren-icon">🚨🔔</div>
            <h2>WAKE UP! YOUR STOP IS HERE!</h2>
            <p className="alarm-text">{ringingMessage}</p>
            <button className="stop-alarm-btn" onClick={handleStopAlarm}>
              🛑 Stop Alarm
            </button>
          </div>
        </div>
      )}

      <header className="app-header">
        <h1>NapRoute 😴📍</h1>
        <p>Never miss your stop again!</p>
        <button
          type="button"
          className="test-sound-btn"
          onClick={() => {
            if (isRinging) {
              handleStopAlarm();
            } else {
              triggerAlarmSound('Sound Test: This is how your alarm will ring!');
            }
          }}
        >
          {isRinging ? '🛑 Stop Test Sound' : '🔊 Test Alarm Sound'}
        </button>
      </header>

      <div className="location-info">
        <h3>📍 Current Location</h3>
        {location ? (
          <p>
            <strong>Lat:</strong> {location.latitude.toFixed(6)}, <strong>Lng:</strong>{' '}
            {location.longitude.toFixed(6)}
          </p>
        ) : (
          <p>Fetching your location... (Please allow permission)</p>
        )}
      </div>

      <div className="create-alarm">
        <h2>Create New Alarm</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Alarm Name (e.g. My Station, College Gate)"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="description"
            placeholder="Description (optional)"
            value={formData.description}
            onChange={handleChange}
          />

          <div className="location-inputs">
            <input
              type="number"
              step="any"
              name="latitude"
              placeholder="Latitude"
              value={formData.latitude}
              onChange={handleChange}
              required
            />
            <input
              type="number"
              step="any"
              name="longitude"
              placeholder="Longitude"
              value={formData.longitude}
              onChange={handleChange}
              required
            />
            <button type="button" onClick={setLocationToCurrent} className="use-current-btn">
              📍 Use Current
            </button>
          </div>

          <input
            type="number"
            name="radius"
            placeholder="Radius (in meters, e.g. 500 for 500m)"
            value={formData.radius}
            onChange={handleChange}
            required
          />
          <button type="submit" className="submit-btn">
            ⏰ Create Alarm
          </button>
        </form>
      </div>

      <div className="alarms-list">
        <h2>Active Alarms</h2>
        {alarms.length === 0 ? (
          <p className="empty-text">No active alarms. Create one above!</p>
        ) : (
          <ul>
            {alarms.map((alarm) => (
              <li key={alarm._id}>
                <div>
                  <strong>{alarm.name}</strong>
                  {alarm.description && <span> — {alarm.description}</span>}
                  <div className="alarm-meta">
                    Radius: {alarm.radius}m | Lat: {alarm.location.coordinates[1].toFixed(4)}, Lng:{' '}
                    {alarm.location.coordinates[0].toFixed(4)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {triggeredAlarms.length > 0 && (
        <div className="triggered-alarms">
          <h2>Recently Triggered</h2>
          <ul>
            {triggeredAlarms.map((alarm, index) => (
              <li key={index} className="triggered-item">
                🚨 <strong>{alarm.name}</strong> was triggered!
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
