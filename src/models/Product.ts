import mongoose, { Document, Schema, Model } from 'mongoose';

// Product interface
export interface IProduct extends Document {
  name: string;
  description: string;
  regularPrice: number;
  salePrice: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Create schema
const productSchema = new Schema<IProduct>({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Product description is required']
  },
  regularPrice: {
    type: Number,
    required: [true, 'Regular price is required']
  },
  salePrice: {
    type: Number,
    required: [true, 'Sale price is required']
  },
  imageUrl: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const Product: Model<IProduct> = mongoose.model<IProduct>('Product', productSchema);

export default Product;