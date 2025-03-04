import express from 'express';
import { registerUser, loginUser, getUserProfile } from '../controllers/authController';
import { protect } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';


const router = express.Router();

// Routes
router.post('/register',authLimiter, registerUser);
router.post('/login',authLimiter, loginUser);
router.get('/profile', protect, getUserProfile);


export default router;