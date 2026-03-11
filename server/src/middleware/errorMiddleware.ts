import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

    console.error('Error:', err.message);
    if (process.env.NODE_ENV === 'production') {
        console.error(err.stack); // Log stack trace specifically for production debugging
    }

    res.status(statusCode).json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};
