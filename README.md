# PropertyHub - React Frontend with Node.js Backend

A modern property listing website built with React frontend and Node.js backend with MongoDB.

## Features

- 🏠 Display property listings in a beautiful, responsive grid
- 📱 Mobile-friendly design
- 🎨 Modern UI with smooth animations
- 🔄 Real-time data fetching from backend API
- 📊 Property details including images, prices, and locations

## Project Structure

```
Major with react/
├── backend/          # Node.js + Express + MongoDB backend
│   ├── app.js        # Main server file
│   ├── models/       # MongoDB models
│   └── ...
└── frontend/         # React + Vite frontend
    ├── src/
    │   ├── components/   # React components
    │   ├── services/     # API services
    │   └── App.jsx       # Main app component
    └── ...
```

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (running locally or cloud instance)
- npm or yarn

## Setup Instructions

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the backend directory with your MongoDB connection string:
   ```
   MONGO_URI=your_mongodb_connection_string
   SECRET=your_session_secret
   ```

4. Start the backend server:
   ```bash
   node app.js
   ```

   The backend will run on `http://localhost:3000`

### 2. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

   The frontend will run on `http://localhost:5173`

## API Endpoints

The backend provides the following API endpoints for the React frontend:

- `GET /api/listings` - Get all property listings
- `GET /api/listings/:id` - Get a specific property listing

## Technologies Used

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- CORS for cross-origin requests
- Multer for file uploads
- Passport.js for authentication

### Frontend
- React 19
- Vite for build tooling
- Axios for API calls
- CSS3 with modern styling
- Responsive design

## Features

- **Property Listings**: Display all properties in a responsive grid
- **Property Cards**: Each property shows image, title, description, price, and location
- **Loading States**: Smooth loading animations while fetching data
- **Error Handling**: Graceful error handling with user-friendly messages
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices

## Development

To add new features:

1. **Backend**: Add new API endpoints in `backend/app.js`
2. **Frontend**: Create new components in `frontend/src/components/`
3. **Styling**: Add CSS files alongside your components

## Troubleshooting

- Make sure MongoDB is running and accessible
- Check that both backend (port 3000) and frontend (port 5173) are running
- Verify your `.env` file has the correct MongoDB connection string
- Check browser console for any CORS or API errors

## License

This project is open source and available under the MIT License. 