import { Request, Response } from 'express';
import User, { IUser } from '../models/User';
import asyncHandler from '../utils/asyncHandler';
import ApiError from '../utils/ApiError';
import { generateToken } from './helpers';


interface RegisterUserRequest {
    username: string;
    email: string;
    password: string;
    isAdmin:boolean

}

interface LoginUserRequest {
    email: string;
    password: string;
}

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = asyncHandler(async (req: Request, res: Response) => {
    const { username, email, password,isAdmin }: RegisterUserRequest = req.body;

    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
        throw new ApiError(400, 'User already exists');
    }

    const user = await User.create({
        username,
        email,
        password,
        isAdmin: isAdmin || false 

    });

    if (user) {
        res.status(201).json({
            _id: user._id.toString(),
            username: user.username,
            email: user.email,
            token: generateToken(user._id.toString())
        });
    } else {
        throw new ApiError(400, 'Invalid user data');
    }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const loginUser = asyncHandler(async (req: Request, res: Response) => {
    const { email, password }: LoginUserRequest = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
        throw new ApiError(401, 'Invalid credentials');
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
        throw new ApiError(401, 'Invalid credentials');
    }

    res.status(200).json({
        _id: user._id.toString(),
        username: user.username,
        email: user.email,
        token: generateToken(user._id.toString())
    });
});

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = asyncHandler(async (req: Request, res: Response) => {
    const user = await User.findById(req.user?._id);

    if (user) {
        res.status(200).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            purchaseCount: user.purchaseCount
        });
    } else {
        throw new ApiError(404, 'User not found');
    }
});
