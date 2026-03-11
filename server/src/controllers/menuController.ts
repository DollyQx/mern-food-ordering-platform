import { Request, Response } from 'express';
import { Category, MenuItem } from '../models/Menu';
import fs from 'fs';
import path from 'path';

// @desc    Get all categories
// @route   GET /api/menu/categories
// @access  Public
export const getCategories = async (req: Request, res: Response) => {
    try {
        const categories = await Category.find({ isActive: true }).lean();
        res.json(categories);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a category
// @route   POST /api/menu/categories
// @access  Private/Admin
export const createCategory = async (req: Request, res: Response) => {
    try {
        const { name, isAvailable, isLongDistance, availability, subCategories, availablePincodes } = req.body;
        const image = req.file ? req.file.path : '';

        let parsedAvailability;
        if (availability) {
            try {
                parsedAvailability = typeof availability === 'string' ? JSON.parse(availability) : availability;
            } catch (e) {
                console.error("Error parsing availability", e);
            }
        }

        let parsedSubCategories = [];
        if (subCategories) {
            try {
                parsedSubCategories = typeof subCategories === 'string' ? JSON.parse(subCategories) : subCategories;
            } catch (e) {
                console.error("Error parsing subCategories", e);
            }
        }

        let parsedPincodes = [];
        if (availablePincodes) {
            try {
                parsedPincodes = typeof availablePincodes === 'string' ? JSON.parse(availablePincodes) : availablePincodes;
            } catch (e) {
                console.error("Error parsing availablePincodes", e);
            }
        }

        const category = await Category.create({
            name,
            image,
            isAvailable: isAvailable === 'true' || isAvailable === true,
            isLongDistance: isLongDistance === 'true' || isLongDistance === true,
            availability: parsedAvailability,
            subCategories: parsedSubCategories,
            availablePincodes: parsedPincodes
        });
        res.status(201).json(category);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get menu items by category
// @route   GET /api/menu/items
// @access  Public
export const getMenuItems = async (req: Request, res: Response) => {
    try {
        const { categoryId } = req.query;

        // 1. Get IDs of all Active and Available Categories
        const activeCategories = await Category.find({
            isActive: true,
            isAvailable: true
        }).select('_id').lean();

        const activeCategoryIds = activeCategories.map(cat => cat._id);

        let query: any = {
            // isAvailable: true, // allow showing disabled items
            category: { $in: activeCategoryIds } // Only items in available categories
        };

        // If specific category requested, ensure it is one of the available ones
        if (categoryId) {
            query = {
                ...query,
                category: categoryId
            };
        }

        const items = await MenuItem.find(query).populate('category', 'name isLongDistance').lean();
        res.json(items);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create menu item
// @route   POST /api/menu/items
// @access  Private/Admin
export const createMenuItem = async (req: Request, res: Response) => {
    try {
        const { name, description, price, category, isVeg, variants } = req.body;
        // Check if file is uploaded
        const image = req.file ? req.file.path : '';

        let parsedVariants = [];
        if (variants) {
            try {
                parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : variants;
            } catch (e) {
                console.error('Error parsing variants', e);
                parsedVariants = [];
            }
        }

        const item = await MenuItem.create({
            name,
            description,
            price,
            category,
            subCategory: req.body.subCategory,
            image,
            isVeg: isVeg === 'true' || isVeg === true,
            variants: parsedVariants
        });
        res.status(201).json(item);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update menu item
// @route   PUT /api/menu/items/:id
// @access  Private/Admin
export const updateMenuItem = async (req: Request, res: Response) => {
    try {
        const { name, description, price, category, isVeg, isAvailable } = req.body;

        const item = await MenuItem.findById(req.params.id);

        if (item) {
            item.name = name || item.name;
            item.description = description || item.description;
            item.price = price || item.price;
            item.category = category || item.category;
            if (req.body.subCategory !== undefined) item.subCategory = req.body.subCategory;
            item.isVeg = isVeg !== undefined ? (isVeg === 'true' || isVeg === true) : item.isVeg;
            item.isAvailable = isAvailable !== undefined ? (isAvailable === 'true' || isAvailable === true) : item.isAvailable;

            if (req.body.variants) {
                try {
                    item.variants = typeof req.body.variants === 'string' ? JSON.parse(req.body.variants) : req.body.variants;
                } catch (e) {
                    console.error('Error parsing variants update', e);
                }
            }

            if (req.file) {
                item.image = req.file.path;
            }

            const updatedItem = await item.save();
            res.json(updatedItem);
        } else {
            res.status(404).json({ message: 'Menu item not found' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete menu item
// @route   DELETE /api/menu/items/:id
// @access  Private/Admin
export const deleteMenuItem = async (req: Request, res: Response) => {
    try {
        const item = await MenuItem.findById(req.params.id);

        if (item) {
            await MenuItem.deleteOne({ _id: item._id });
            res.json({ message: 'Item removed' });
        } else {
            res.status(404).json({ message: 'Menu item not found' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a category
// @route   PUT /api/menu/categories/:id
// @access  Private/Admin
export const updateCategory = async (req: Request, res: Response) => {
    try {
        const { name, isActive, isAvailable, isLongDistance, availability, availablePincodes } = req.body;
        const category = await Category.findById(req.params.id);

        if (category) {
            category.name = name || category.name;
            if (isActive !== undefined) category.isActive = isActive;

            if (isAvailable !== undefined) {
                category.isAvailable = isAvailable === 'true' || isAvailable === true;
            }

            if (isLongDistance !== undefined) {
                category.isLongDistance = isLongDistance === 'true' || isLongDistance === true;
            }

            if (availability) {
                try {
                    category.availability = typeof availability === 'string' ? JSON.parse(availability) : availability;
                } catch (e) {
                    console.error("Error parsing availability update", e);
                }
            }

            if (req.body.subCategories) {
                try {
                    category.subCategories = typeof req.body.subCategories === 'string' ? JSON.parse(req.body.subCategories) : req.body.subCategories;
                } catch (e) {
                    console.error("Error parsing subCategories update", e);
                }
            }

            if (availablePincodes) {
                try {
                    category.availablePincodes = typeof availablePincodes === 'string' ? JSON.parse(availablePincodes) : availablePincodes;
                } catch (e) {
                    console.error("Error parsing availablePincodes update", e);
                }
            }

            if (req.file) {
                category.image = req.file.path;
            }

            const updatedCategory = await category.save();
            res.json(updatedCategory);
        } else {
            res.status(404).json({ message: 'Category not found' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a category
// @route   DELETE /api/menu/categories/:id
// @access  Private/Admin
export const deleteCategory = async (req: Request, res: Response) => {
    try {
        const category = await Category.findById(req.params.id);

        if (category) {
            await Category.deleteOne({ _id: category._id });
            res.json({ message: 'Category removed' });
        } else {
            res.status(404).json({ message: 'Category not found' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
