import express, { Express } from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db';
 import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/authRoutes';

dotenv.config();

 connectDB();
const app: Express = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);



app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.log(`Error: ${err.message}`);
  
  process.exit(1);
});
