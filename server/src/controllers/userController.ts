import { Request, Response } from 'express';
import User from '../models/User';

// @desc    Get user profile
// @route   GET /api/user/profile
// @access  Private
export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = await User.findById((req as any).user._id).select('-password');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user address
// @route   PUT /api/user/address
// @access  Private
export const updateUserAddress = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = await User.findById((req as any).user._id);

        if (user) {
            user.address = req.body.address;
            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                address: updatedUser.address,
                walletBalance: updatedUser.walletBalance
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
