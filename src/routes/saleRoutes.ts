import express from 'express';
import { 
  createSale, 
  getSale, 
  getActiveSales, 
  startSale,
  endSale,
  resetSale
} from '../controllers/saleController';
import { getLeaderboard } from '../controllers/purchaseController';
import { protect, admin } from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/active', getActiveSales);
router.get('/:id', getSale);
router.get('/:saleId/leaderboard', getLeaderboard);

// Admin routes
router.post('/', protect, admin, createSale);
router.patch('/:id/start', protect, admin, startSale);
router.patch('/:id/end', protect, admin, endSale);
router.patch('/:id/reset', protect, admin, resetSale);

export default router;