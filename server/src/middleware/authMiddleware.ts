import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

interface AuthRequest extends Request {
    user?: any;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');

            // Get user from the token
            const user = await User.findById(decoded.id).select('-password');

            if (!user) {
                res.status(401).json({ message: 'Not authorized, user not found' });
                return;
            }

            req.user = user;
            next();
        } catch (error: any) {
            console.error('Token verification failed:', error);
            if (error.name === 'TokenExpiredError') {
                res.status(401).json({ message: 'Token expired' });
                return;
            }
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

export const admin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(401).json({ message: 'Not authorized as an admin' });
    }
};
