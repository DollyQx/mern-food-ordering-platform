import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { DeliveryZone } from '../models/Location';

dotenv.config();

const seedZones = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log('MongoDB Connected');

        await DeliveryZone.deleteMany({}); // Clear existing zones

        // Create a large polygon covering Delhi NCR (approx)
        // Coordinates must be closing loop (start = end)
        const delhiNCRPolygon = {
            type: 'Polygon',
            coordinates: [[
                [76.8, 28.4], // Bottom Left
                [77.6, 28.4], // Bottom Right
                [77.6, 28.9], // Top Right
                [76.8, 28.9], // Top Left
                [76.8, 28.4]  // Closing Loop
            ]]
        };

        await DeliveryZone.create({
            name: 'Delhi NCR',
            area: delhiNCRPolygon,
            isActive: true
        });

        console.log('Delivery Zone Seeded: Delhi NCR');
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

seedZones();
