import { Request, Response } from 'express';
import * as purchaseService from '../services/purchaseService';
import Purchase from '../models/Purchase';
import asyncHandler from '../utils/asyncHandler';

interface CreatePurchaseRequest {
  saleEventId: string;
  quantity?: number;
}

// @desc    Process a purchase during a flash sale
// @route   POST /api/purchases
// @access  Private
export const createPurchase = asyncHandler(async (req: Request, res: Response) => {
  const { saleEventId, quantity = 1 }: CreatePurchaseRequest = req.body;
  const userId = req.user?._id.toString() as string;
  
  const result = await purchaseService.processPurchase(userId, saleEventId, quantity);
  
  res.status(201).json({
    message: 'Purchase successful',
    purchase: result.purchase,
    remainingStock: result.remainingStock
  });
});

// @desc    Get purchase leaderboard
// @route   GET /api/sales/:saleId/leaderboard
// @access  Public
export const getLeaderboard = asyncHandler(async (req: Request, res: Response) => {
  const { saleId } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  
  const leaderboard = await purchaseService.getLeaderboard(saleId, page, limit);
  
  res.status(200).json(leaderboard);
});

// @desc    Get user purchases for a sale
// @route   GET /api/purchases/mysales/:saleId
// @access  Private
export const getUserPurchasesForSale = asyncHandler(async (req: Request, res: Response) => {
  const { saleId } = req.params;
  const userId = req.user?._id.toString() as string;
  
  const purchases = await Purchase.find({
    saleEventId: saleId,
    userId
  }).sort({ purchaseTime: 1 });
  
  res.status(200).json(purchases);
});