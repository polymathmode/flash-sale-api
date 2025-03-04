import mongoose, { Document, Schema, Model } from 'mongoose';

export enum SaleStatus {
  SCHEDULED = 'scheduled',
  ACTIVE = 'active',
  ENDED = 'ended'
}

export interface ISaleEvent extends Document {
  productId: mongoose.Types.ObjectId;
  startTime: Date;
  endTime?: Date;
  initialStock: number;
  currentStock: number;
  maxPurchasePerUser: number;
  status: SaleStatus;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const saleEventSchema = new Schema<ISaleEvent>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required']
  },
  startTime: {
    type: Date,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: Date
  },
  initialStock: {
    type: Number,
    required: [true, 'Initial stock is required'],
    default: 200
  },
  currentStock: {
    type: Number,
    required: [true, 'Current stock is required'],
    default: 200
  },
  maxPurchasePerUser: {
    type: Number,
    default: 1
  },
  status: {
    type: String,
    enum: Object.values(SaleStatus),
    default: SaleStatus.SCHEDULED
  },
  isActive: {
    type: Boolean,
    default: false
  }
}, { 
  timestamps: true
});

saleEventSchema.index({ isActive: 1 });
saleEventSchema.index({ startTime: 1 });
saleEventSchema.index({ status: 1 });

const SaleEvent: Model<ISaleEvent> = mongoose.model<ISaleEvent>('SaleEvent', saleEventSchema);

export default SaleEvent;