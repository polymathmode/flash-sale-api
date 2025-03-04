import express from 'express';
import { 
  createPurchase, 
  getUserPurchasesForSale,
} from '../controllers/purchaseController';
import { protect } from '../middleware/auth';
import { purchaseLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// Protected routes
router.post('/', protect, purchaseLimiter, createPurchase);
router.get('/mysales/:saleId', protect, getUserPurchasesForSale);

export default router;