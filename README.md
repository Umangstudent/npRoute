# NapRoute 😴📍

A location-based alarm app that triggers alerts when a user enters a target radius. Built with MongoDB (geospatial queries), Express.js, React, and Node.js.

## Features
- **Geospatial Queries**: Uses MongoDB's `2dsphere` index and `$geoNear` to calculate distances between user location and alarm coordinates.
- **Browser Geolocation API**: Continuously tracks user location to check for nearby alarms in real-time.
- **REST API**: Manages alarm creation, retrieval, and check operations.

## Prerequisites
- Node.js installed
- MongoDB installed and running locally on port 27017

## Installation & Setup

1. **Clone/Navigate to Project**
   ```bash
   cd NapRoute
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   npm start
   ```
   (Server runs on http://localhost:5000)

3. **Setup Frontend**
   Open a new terminal:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   (Vite development server will start, usually on http://localhost:5173)

## Usage
1. Open the frontend in your browser and allow location access.
2. The app will fetch your current location.
3. You can create a new alarm by setting the target latitude, longitude, and radius (in meters).
4. As you move, the app will constantly send your coordinates to the backend to check if you have entered the radius of any active alarms. If so, an alert will be triggered.
