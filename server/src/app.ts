import express, { Application } from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/errorMiddleware';
import authRoutes from './routes/authRoutes';
import menuRoutes from './routes/menuRoutes';
import orderRoutes from './routes/orderRoutes';
import locationRoutes from './routes/locationRoutes';
import adminRoutes from './routes/adminRoutes';
import discountRoutes from './routes/discountRoutes';
import paymentRoutes from './routes/paymentRoutes';
import userRoutes from './routes/userRoutes';
import notificationRoutes from './routes/notificationRoutes';
import partyHallRoutes from './routes/partyHallRoutes';

const app: Application = express();

// Trust Proxy for Render/Cloud deployments (CRITICAL for correct IP rate limiting)
app.set('trust proxy', 1);

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '2000'), // Configurable, default 2000
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(cors());
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(limiter); // Apply rate limiting to all requests

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/user', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/party-hall', partyHallRoutes);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/', (req, res) => {
    res.send('Zomoggy Server is running...');
});

// Error Handling Middleware (must be last)
app.use(errorHandler);

export default app;
