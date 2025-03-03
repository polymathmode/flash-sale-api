import { Request, Response } from 'express';
import * as saleService from '../services/saleService';
import asyncHandler from '../utils/asyncHandler';

interface ResetSaleRequest {
  stock?: number;
}

// @desc    Create a new flash sale event
// @route   POST /api/sales
// @access  Private/Admin
export const createSale = asyncHandler(async (req: Request, res: Response) => {
  const saleEvent = await saleService.createSaleEvent(req.body);
  res.status(201).json(saleEvent);
});

// @desc    Get details of a specific sale
// @route   GET /api/sales/:id
// @access  Public
export const getSale = asyncHandler(async (req: Request, res: Response) => {
  const saleEvent = await saleService.getSaleEvent(req.params.id);
  res.status(200).json(saleEvent);
});

// @desc    Get all active sales
// @route   GET /api/sales/active
// @access  Public
export const getActiveSales = asyncHandler(async (req: Request, res: Response) => {
  const activeSales = await saleService.getActiveSales();
  res.status(200).json(activeSales);
});

// @desc    Start a scheduled sale
// @route   PATCH /api/sales/:id/start
// @access  Private/Admin
export const startSale = asyncHandler(async (req: Request, res: Response) => {
  const saleEvent = await saleService.startSale(req.params.id);
  res.status(200).json(saleEvent);
});

// @desc    End an active sale
// @route   PATCH /api/sales/:id/end
// @access  Private/Admin
export const endSale = asyncHandler(async (req: Request, res: Response) => {
  const saleEvent = await saleService.endSale(req.params.id);
  res.status(200).json(saleEvent);
});

// @desc    Reset stock for a sale (for restarting)
// @route   PATCH /api/sales/:id/reset
// @access  Private/Admin
export const resetSale = asyncHandler(async (req: Request, res: Response) => {
  const { stock }: ResetSaleRequest = req.body;
  const saleEvent = await saleService.resetSaleStock(req.params.id, stock);
  res.status(200).json(saleEvent);
});