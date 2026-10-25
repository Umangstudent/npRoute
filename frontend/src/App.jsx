import { useState, useEffect } from 'react';
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
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    latitude: '',
    longitude: '',
    radius: ''
  });

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
            setTriggeredAlarms(prev => [...prev, ...response.data]);
            alert(`ALARM TRIGGERED: You entered the radius of ${response.data.map(a => a.name).join(', ')}!`);
            fetchAlarms(); // refresh active alarms list
          }
        } catch (error) {
          console.error('Error checking alarms:', error);
        }
      },
      (error) => console.error('Error getting location:', error),
      { enableHighAccuracy: true, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watcher);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const setLocationToCurrent = () => {
    if (location) {
      setFormData(prev => ({
        ...prev,
        latitude: location.latitude,
        longitude: location.longitude
      }));
    } else {
      alert("Current location not available yet.");
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
      alert('Error creating alarm');
    }
  };

  return (
    <div className="App">
      <h1>NapRoute 😴📍</h1>
      <p>Never miss your stop again!</p>
      
      <div className="location-info">
        <h3>Current Location</h3>
        {location ? (
          <p>Lat: {location.latitude.toFixed(6)}, Lng: {location.longitude.toFixed(6)}</p>
        ) : (
          <p>Fetching location...</p>
        )}
      </div>

      <div className="create-alarm">
        <h2>Create New Alarm</h2>
        <form onSubmit={handleSubmit}>
          <input type="text" name="name" placeholder="Alarm Name (e.g. My Station)" value={formData.name} onChange={handleChange} required />
          <input type="text" name="description" placeholder="Description" value={formData.description} onChange={handleChange} />
          
          <div className="location-inputs">
            <input type="number" step="any" name="latitude" placeholder="Latitude" value={formData.latitude} onChange={handleChange} required />
            <input type="number" step="any" name="longitude" placeholder="Longitude" value={formData.longitude} onChange={handleChange} required />
            <button type="button" onClick={setLocationToCurrent} className="use-current-btn">Use Current</button>
          </div>
          
          <input type="number" name="radius" placeholder="Radius (in meters)" value={formData.radius} onChange={handleChange} required />
          <button type="submit">Create Alarm</button>
        </form>
      </div>

      <div className="alarms-list">
        <h2>Active Alarms</h2>
        {alarms.length === 0 ? <p>No active alarms.</p> : (
          <ul>
            {alarms.map(alarm => (
              <li key={alarm._id}>
                <strong>{alarm.name}</strong> - Radius: {alarm.radius}m
                <br />
                <small>Lat: {alarm.location.coordinates[1].toFixed(4)}, Lng: {alarm.location.coordinates[0].toFixed(4)}</small>
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
                🚨 {alarm.name} was triggered!
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
