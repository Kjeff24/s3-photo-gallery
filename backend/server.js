import express from 'express';
import cors from 'cors';
import { connectDB } from './config/database.js';
import photoRoutes from './routes/photoRoutes.js';
import errorHandler from './middleware/errorHandler.js';

// Connect to database
connectDB();

const app = express();

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware
app.use(cors());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Photo Blog API' });
});

app.use('/api/photos', photoRoutes);

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
