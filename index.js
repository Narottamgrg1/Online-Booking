import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import http from 'http'; // Import http to create server

import authRoute from './routes/auth.route.js';
import testRoute from './routes/test.route.js';
import userRoute from './routes/user.route.js';
import sportRoute from './routes/sport.route.js';
import venueRoute from './routes/venue.route.js';
import courtRoute from './routes/court.route.js';
import availabilityRoute from './routes/availability.route.js';
import bookRoute from './routes/book.route.js';
import paymentRoute from './routes/payment.route.js';
import tournamentRoute from "./routes/tournament.route.js";
import tournamentRegisterRoute from "./routes/tournamentRegister.route.js";
import resultRoute from './routes/result.route.js';
import reviewRoute from './routes/review.route.js';
import challengeRoute from './routes/challenge.route.js';
import loyaltyRoute from './routes/loyalty.route.js';

import './middleware/cronJobs.js';

import { setupWebSocket } from './websocket/index.js'; // Import your websocket setup

dotenv.config();

console.log('BACKEND_URI:', process.env.BACKEND_URI);
console.log('KHALTI_GATEWAY_URL:', process.env.KHALTI_GATEWAY_URL);

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoute);
app.use('/api/test', testRoute);
app.use('/api/user', userRoute);
app.use('/api/sport', sportRoute);
app.use('/api/venue', venueRoute);
app.use('/api/court', courtRoute);
app.use('/api/availability', availabilityRoute);
app.use('/api/book', bookRoute);
app.use('/api/payment', paymentRoute);
app.use('/api/tournament', tournamentRoute);
app.use('/api/register', tournamentRegisterRoute);
app.use('/api/result', resultRoute);
app.use('/api/review', reviewRoute);
app.use('/api/challenge', challengeRoute);
app.use('/api/loyalty', loyaltyRoute);

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Court Booking Backend is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'An unexpected error occurred',
    error: err.message,
  });
});

// Create HTTP server and attach Express app
const server = http.createServer(app);

// Setup WebSocket on this server
setupWebSocket(server);

const PORT = process.env.PORT || 8800;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
