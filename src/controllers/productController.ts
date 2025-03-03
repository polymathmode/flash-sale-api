import { Request, Response } from 'express';
import Product, { IProduct } from '../models/Product';
import asyncHandler from '../utils/asyncHandler';
import ApiError from '../utils/ApiError';

// @desc    Get all products
// @route   GET /api/products
// @access  Public
export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const products = await Product.find({ isActive: true });
  res.status(200).json(products);
});

// @desc    Get product by ID
// @route   GET /api/products/:id
// @access  Public
export const getProductById = asyncHandler(async (req: Request, res: Response) => {
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }
  
  res.status(200).json(product);
});

interface CreateProductRequest {
  name: string;
  description: string;
  regularPrice: number;
  salePrice: number;
  imageUrl?: string;
}

// @desc    Create a new product
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, regularPrice, salePrice, imageUrl }: CreateProductRequest = req.body;
  
  // Validate input
  if (!name || !description) {
    throw new ApiError(400, 'Please provide name and description');
  }
  
  if (regularPrice <= 0 || salePrice <= 0) {
    throw new ApiError(400, 'Prices must be greater than zero');
  }
  
  if (salePrice > regularPrice) {
    throw new ApiError(400, 'Sale price cannot be higher than regular price');
  }
  
  // Check if product with same name exists
  const existingProduct = await Product.findOne({ name });
  if (existingProduct) {
    throw new ApiError(400, 'Product with this name already exists');
  }
  
  // Create product
  const product = await Product.create({
    name,
    description,
    regularPrice,
    salePrice,
    imageUrl: imageUrl || '',
    isActive: true
  });
  
  res.status(201).json(product);
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, regularPrice, salePrice, imageUrl, isActive } = req.body;
  
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }
  
  // Update fields
  if (name) product.name = name;
  if (description) product.description = description;
  if (regularPrice) product.regularPrice = regularPrice;
  if (salePrice) product.salePrice = salePrice;
  if (imageUrl) product.imageUrl = imageUrl;
  if (isActive !== undefined) product.isActive = isActive;
  
  // Validate updated product
  if (product.salePrice > product.regularPrice) {
    throw new ApiError(400, 'Sale price cannot be higher than regular price');
  }
  
  const updatedProduct = await product.save();
  
  res.status(200).json(updatedProduct);
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }
  
  // Check if product is being used in any active sales
  // This would require a check against SaleEvent model
  // Implementation omitted for brevity
  
  // Instead of deleting, mark as inactive
  product.isActive = false;
  await product.save();
  
  res.status(200).json({ message: 'Product deactivated' });
});