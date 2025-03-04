import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IPurchase extends Document {
  saleEventId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  quantity: number;
  purchaseTime: Date;
  totalPrice: number;
  transactionId: string;
  createdAt: Date;
  updatedAt: Date;
}

const purchaseSchema = new Schema<IPurchase>({
  saleEventId: {
    type: Schema.Types.ObjectId,
    ref: 'SaleEvent',
    required: [true, 'Sale event ID is required']
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: 1
  },
  purchaseTime: {
    type: Date,
    default: Date.now,
    index: true 
  },
  totalPrice: {
    type: Number,
    required: [true, 'Total price is required']
  },
  transactionId: {
    type: String,
    unique: true
  }
}, { timestamps: true });

//  indexes for better query performance
purchaseSchema.index({ saleEventId: 1, userId: 1 });
purchaseSchema.index({ purchaseTime: 1 }); // For leaderboard queries

const Purchase: Model<IPurchase> = mongoose.model<IPurchase>('Purchase', purchaseSchema);

export default Purchase;