import { Request, Response } from 'express';
import { Address, DeliveryZone } from '../models/Location';

interface AuthRequest extends Request {
    user?: any;
}

// @desc    Add a new address
// @route   POST /api/location/address
// @access  Private
export const addAddress = async (req: AuthRequest, res: Response) => {
    try {
        const { label, addressLine, city, pincode, latitude, longitude } = req.body;

        const address = await Address.create({
            user: req.user._id,
            label,
            addressLine,
            city,
            pincode,
            location: {
                type: 'Point',
                coordinates: [longitude, latitude],
            },
        });

        res.status(201).json(address);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user addresses
// @route   GET /api/location/address
// @access  Private
export const getAddresses = async (req: AuthRequest, res: Response) => {
    try {
        const addresses = await Address.find({ user: req.user._id });
        res.json(addresses);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Check if a location is serviceable
// @route   POST /api/location/check
// @access  Public
export const checkServiceability = async (req: Request, res: Response) => {
    try {
        const { latitude, longitude } = req.body;

        const isServiceable = await DeliveryZone.findOne({
            area: {
                $geoIntersects: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [longitude, latitude],
                    },
                },
            },
            isActive: true,
        });

        if (isServiceable) {
            res.json({ serviceable: true, zone: isServiceable.name });
        } else {
            res.json({ serviceable: false });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a delivery zone (Admin)
// @route   POST /api/location/zones
// @access  Private (Admin)
export const createDeliveryZone = async (req: Request, res: Response) => {
    try {
        const { name, coordinates } = req.body; // coordinates should be [[[lon, lat], ...]]

        const zone = await DeliveryZone.create({
            name,
            area: {
                type: 'Polygon',
                coordinates
            }
        });

        res.status(201).json(zone);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}
