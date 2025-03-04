import express from 'express';
import { protect, admin } from '../middleware/auth';

import { getProducts, getProductById, createProduct } from '../controllers/productController';

const router = express.Router();

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', protect, admin, createProduct);

export default router;