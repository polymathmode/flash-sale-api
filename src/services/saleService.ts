import SaleEvent, { ISaleEvent, SaleStatus } from '../models/SaleEvent';
import ApiError from '../utils/ApiError';

interface SaleEventCreateData {
  productId: string;
  startTime: Date | string;
  initialStock?: number;
  maxPurchasePerUser?: number;
}

/**
 * Create a new flash sale event
 */
export const createSaleEvent = async (saleData: SaleEventCreateData): Promise<ISaleEvent> => {
  // Validate that start time is in the future
  if (new Date(saleData.startTime) <= new Date()) {
    throw new ApiError(400, 'Sale start time must be in the future');
  }

  // Create the sale event
  const saleEvent = await SaleEvent.create({
    ...saleData,
    initialStock: saleData.initialStock || 200,
    currentStock: saleData.initialStock || 200,
    status: SaleStatus.SCHEDULED
  });

  return saleEvent;
};

/**
 * Get details of a sale event
 */
export const getSaleEvent = async (saleEventId: string): Promise<ISaleEvent> => {
  const saleEvent = await SaleEvent.findById(saleEventId).populate('productId');
  
  if (!saleEvent) {
    throw new ApiError(404, 'Sale event not found');
  }
  
  return saleEvent;
};

/**
 * Get currently active sales
 */
export const getActiveSales = async (): Promise<ISaleEvent[]> => {
  const now = new Date();
  
  const activeSales = await SaleEvent.find({
    startTime: { $lte: now },
    $or: [
      { endTime: { $gt: now } },
      { endTime: { $exists: false } }
    ],
    status: SaleStatus.ACTIVE,
    currentStock: { $gt: 0 }
  }).populate('productId');
  
  return activeSales;
};

/**
 * Start a scheduled sale
 */
export const startSale = async (saleEventId: string): Promise<ISaleEvent> => {
  const now = new Date();
  
  
  const saleEvent = await SaleEvent.findById(saleEventId);
  
  if (!saleEvent) {
    throw new ApiError(404, 'Sale event not found');
  }
  
  if (saleEvent.status !== SaleStatus.SCHEDULED) {
    throw new ApiError(400, 'Sale is not in scheduled state');
  }
  
//   if (saleEvent.startTime > now) {
//     throw new ApiError(400, 'Sale cannot be started before scheduled start time');
//   }
  
  saleEvent.status = SaleStatus.ACTIVE;
  saleEvent.isActive = true;
  await saleEvent.save();
  
  return saleEvent;
};

/**
 * End an active sale
 */
export const endSale = async (saleEventId: string): Promise<ISaleEvent> => {
  const now = new Date();
  
  const saleEvent = await SaleEvent.findById(saleEventId);
  
  if (!saleEvent) {
    throw new ApiError(404, 'Sale event not found');
  }
  
  if (saleEvent.status !== SaleStatus.ACTIVE) {
    throw new ApiError(400, 'Sale is not active');
  }
  
  saleEvent.status = SaleStatus.ENDED;
  saleEvent.isActive = false;
  saleEvent.endTime = now;
  await saleEvent.save();
  
  return saleEvent;
};

/**
 * Reset stock for a sale event (for restarting)
 */
export const resetSaleStock = async (saleEventId: string, newStock: number = 200): Promise<ISaleEvent> => {
  const saleEvent = await SaleEvent.findById(saleEventId);
  
  if (!saleEvent) {
    throw new ApiError(404, 'Sale event not found');
  }
  
  if (saleEvent.status === SaleStatus.ACTIVE) {
    throw new ApiError(400, 'Cannot reset stock for an active sale');
  }
  
  saleEvent.initialStock = newStock;
  saleEvent.currentStock = newStock;
  saleEvent.status = SaleStatus.SCHEDULED;
  saleEvent.isActive = false;
  saleEvent.endTime = undefined;
  await saleEvent.save();
  
  return saleEvent;
};

/**
 * Automatic job to update sale status based on time
 * This should be scheduled to run regularly
 */
export const updateSaleStatuses = async (): Promise<{ activated: number }> => {
  const now = new Date();
  
  // Find scheduled sales that should be activated
  const salesToActivate = await SaleEvent.find({
    status: SaleStatus.SCHEDULED,
    startTime: { $lte: now }
  });
  
  for (const sale of salesToActivate) {
    sale.status = SaleStatus.ACTIVE;
    sale.isActive = true;
    await sale.save();
  }
  
  return {
    activated: salesToActivate.length
  };
};