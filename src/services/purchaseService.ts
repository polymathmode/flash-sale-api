import mongoose from 'mongoose';
import Purchase, { IPurchase } from '../models/Purchase';
import SaleEvent, { SaleStatus } from '../models/SaleEvent';
import User from '../models/User';
import Product from '../models/Product';
import ApiError from '../utils/ApiError';
import { v4 as uuidv4 } from 'uuid';

interface PurchaseResult {
  purchase: IPurchase;
  remainingStock: number;
}

interface LeaderboardPagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface LeaderboardResult {
  purchases: any[];
  pagination: LeaderboardPagination;
}

/**
 * Process a purchase during a flash sale with optimistic concurrency control
 * Uses findOneAndUpdate with versioning to prevent race conditions
 */
export const processPurchase = async (
  userId: string, 
  saleEventId: string, 
  quantity: number = 1
): Promise<PurchaseResult> => {
  // Start a session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Check if sale is active
    const saleEvent = await SaleEvent.findById(saleEventId).session(session);
    
    if (!saleEvent) {
      throw new ApiError(404, 'Sale event not found');
    }
    
    if (saleEvent.status !== SaleStatus.ACTIVE) {
      throw new ApiError(400, 'Sale is not active');
    }
    
    if (saleEvent.currentStock < quantity) {
      throw new ApiError(400, 'Not enough stock available');
    }
    
    // const now = new Date();
    // if (now < saleEvent.startTime) {
    //   throw new ApiError(400, 'Sale has not started yet');
    // }

    // 2. Check if user has already purchased maximum allowed
    const userPurchases = await Purchase.countDocuments({
      saleEventId,
      userId
    }).session(session);
    
    if (userPurchases >= saleEvent.maxPurchasePerUser) {
      throw new ApiError(400, 'You have reached the maximum purchase limit for this sale');
    }

    // 3. Get product details
    const product = await Product.findById(saleEvent.productId).session(session);
    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    // 4. Critical section: Update stock with optimistic concurrency control
    // Using findOneAndUpdate with specific conditions ensures atomicity
    const updatedSale = await SaleEvent.findOneAndUpdate(
      { 
        _id: saleEventId,
        status: SaleStatus.ACTIVE,
        currentStock: { $gte: quantity }
      },
      { 
        $inc: { currentStock: -quantity },
        // If stock is now 0, end the sale
        ...(saleEvent.currentStock - quantity <= 0 ? { 
          status: SaleStatus.ENDED,
        //   endTime: now
        } : {})
      },
      { 
        new: true,
        runValidators: true,
        session
      }
    );

    // If update failed due to concurrent operations or stock depletion
    if (!updatedSale) {
      throw new ApiError(400, 'Unable to complete purchase. Stock may have been depleted.');
    }

    // 5. Create purchase record with a unique transaction ID
    const purchase = await Purchase.create([{
      saleEventId,
      userId,
      productId: product._id,
      quantity,
    //   purchaseTime: now,
      totalPrice: product.salePrice * quantity,
      transactionId: uuidv4()
    }], { session });

    // 6. Update user's purchase count
    await User.findByIdAndUpdate(
      userId,
      { $inc: { purchaseCount: quantity } },
      { session }
    );

    // 7. Commit transaction
    await session.commitTransaction();
    
    return {
      purchase: purchase[0],
      remainingStock: updatedSale.currentStock
    };
  } catch (error) {
    // Abort transaction on error
    await session.abortTransaction();
    throw error;
  } finally {
    // End session
    session.endSession();
  }
};

/**
 * Get purchase leaderboard in chronological order
 */
export const getLeaderboard = async (
  saleEventId: string, 
  page: number = 1, 
  limit: number = 50
): Promise<LeaderboardResult> => {
  const skip = (page - 1) * limit;
  
  // Aggregation pipeline for efficient leaderboard with pagination
  const purchases = await Purchase.aggregate([
    { $match: { saleEventId: new mongoose.Types.ObjectId(saleEventId) } },
    { $sort: { purchaseTime: 1 } },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $project: {
        'user.password': 0,
        'user.__v': 0
      }
    },
    { $skip: skip },
    { $limit: limit },
    {
      $project: {
        purchaseTime: 1,
        quantity: 1,
        totalPrice: 1,
        transactionId: 1,
        'user.username': 1,
        'user._id': 1
      }
    }
  ]);
  
  // Get total count for pagination
  const total = await Purchase.countDocuments({ saleEventId });
  
  return {
    purchases,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
};
