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
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    //  check if sale is active
    const saleEvent = await SaleEvent.findOneAndUpdate(
      { _id: saleEventId, status: SaleStatus.ACTIVE, currentStock: { $gte: quantity } },
      { $inc: { currentStock: -quantity } },
      { new: true, session }
    );

    if (!saleEvent) {
      throw new ApiError(400, 'Sale is inactive or stock depleted.');
    }


    const now = new Date();
    if (now < saleEvent.startTime) {
      throw new ApiError(400, 'Sale has not started yet');
    }

    const userPurchases = await Purchase.countDocuments({
      saleEventId,
      userId
    }).session(session);

    if (userPurchases >= saleEvent.maxPurchasePerUser) {
      throw new ApiError(400, 'You have reached the maximum purchase limit for this sale');
    }

    const product = await Product.findById(saleEvent.productId).session(session);
    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    //  update stock with concurrency control
    const updatedSale = await SaleEvent.findOneAndUpdate(
      {
        _id: saleEventId,
        status: SaleStatus.ACTIVE,
        currentStock: { $gte: quantity }
      },
      {
        $inc: { currentStock: -quantity },
        ...(saleEvent.currentStock - quantity <= 0 ? {
          status: SaleStatus.ENDED,
          endTime: now
        } : {})
      },
      {
        new: true,
        runValidators: true,
        session
      }
    );

    // if update failed due to concurrent operations or stock depletion
    if (!updatedSale) {
      throw new ApiError(400, 'Stock was just sold out. Please try again.');
    }

    const purchase = await Purchase.create([{
      saleEventId,
      userId,
      productId: product._id,
      quantity,
      purchaseTime: now,
      totalPrice: product.salePrice * quantity,
      transactionId: uuidv4()
    }], { session });

    await User.findByIdAndUpdate(
      userId,
      { $inc: { purchaseCount: quantity } },
      { session }
    );

    await session.commitTransaction();

    return {
      purchase: purchase[0],
      remainingStock: updatedSale.currentStock
    };
  } catch (error) {
    await session.abortTransaction();
    throw new ApiError(500, 'Purchase failed. Please try again.');
  } finally {
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

  // aggregation pipeline for efficient leaderboard with pagination
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
