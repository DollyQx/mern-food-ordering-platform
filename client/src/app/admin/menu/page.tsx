'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Category {
    _id: string;
    name: string;
    image?: string;
    isActive?: boolean;
    isAvailable?: boolean;
    isLongDistance?: boolean; // Deprecated
    availablePincodes?: string[]; // Added
    availability?: {
        start: string;
        end: string;
    };
    subCategories?: string[];
}

interface MenuItem {
    _id: string;
    name: string;
    description: string;
    price: number;
    category: { _id: string; name: string; subCategories?: string[] } | string;
    subCategory?: string;
    image: string;
    isVeg: boolean;
    isAvailable: boolean;
    variants: { name: string; price: number }[];
}

export default function MenuManagement() {
    const [items, setItems] = useState<MenuItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form states
    const [newItem, setNewItem] = useState({
        name: '',
        description: '',
        price: '',

        category: '',
        subCategory: '',
        isVeg: true,
        isAvailable: true,
        variants: [] as { name: string; price: number }[],
    });
    const [imageFile, setImageFile] = useState<File | null>(null);

    const [newCategoryName, setNewCategoryName] = useState('');
    const [categoryAvailable, setCategoryAvailable] = useState(true);
    const [categoryPincodes, setCategoryPincodes] = useState(''); // Added State for Pincodes
    const [categoryStart, setCategoryStart] = useState('');
    const [categoryEnd, setCategoryEnd] = useState('');
    const [categorySubCats, setCategorySubCats] = useState(''); // Comma separated string for input
    const [categoryImage, setCategoryImage] = useState<File | null>(null);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [itemsRes, categoriesRes] = await Promise.all([
                api.get('/menu/items'),
                api.get('/menu/categories'),
            ]);
            setItems(itemsRes.data);
            setCategories(categoriesRes.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    const handleAddVariant = () => {
        setNewItem(prev => ({
            ...prev,
            variants: [...prev.variants, { name: '', price: 0 }]
        }));
    };

    const handleRemoveVariant = (index: number) => {
        setNewItem(prev => ({
            ...prev,
            variants: prev.variants.filter((_, i) => i !== index)
        }));
    };

    const handleVariantChange = (index: number, field: 'name' | 'price', value: string | number) => {
        setNewItem(prev => ({
            ...prev,
            variants: prev.variants.map((variant, i) =>
                i === index ? { ...variant, [field]: value } : variant
            )
        }));
    };

    const resetForm = () => {
        setNewItem({
            name: '',
            description: '',
            price: '',

            category: '',
            subCategory: '',
            isVeg: true,
            isAvailable: true,
            variants: [],
        });
        setImageFile(null);
        setEditingId(null);
        // Reset file input value manually if needed, or rely on key
    };

    const handleEditClick = (item: MenuItem) => {
        setEditingId(item._id);
        setNewItem({
            name: item.name,
            description: item.description,
            price: item.price.toString(),
            category: typeof item.category === 'object' ? item.category._id : item.category,
            subCategory: item.subCategory || '',
            isVeg: item.isVeg,
            isAvailable: item.isAvailable,
            variants: item.variants || [],
        });
        setImageFile(null); // Keep existing image unless changed
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteClick = async (id: string) => {
        if (!confirm('Are you sure you want to delete this item?')) return;
        try {
            await api.delete(`/menu/items/${id}`);
            setItems(items.filter(i => i._id !== id));
        } catch (error) {
            console.error('Delete failed', error);
            alert('Failed to delete item');
        }
    };

    const handleSubmitItem = async (e: React.FormEvent) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('name', newItem.name);
        formData.append('description', newItem.description);
        formData.append('price', newItem.price);
        formData.append('category', newItem.category);
        formData.append('subCategory', newItem.subCategory);
        formData.append('isVeg', String(newItem.isVeg));
        formData.append('isAvailable', String(newItem.isAvailable));
        formData.append('variants', JSON.stringify(newItem.variants));
        if (imageFile) {
            formData.append('image', imageFile);
        }

        try {
            if (editingId) {
                await api.put(`/menu/items/${editingId}`, formData);
                alert('Item updated successfully');
            } else {
                await api.post('/menu/items', formData);
                alert('Item added successfully');
            }
            resetForm();
            fetchData();
        } catch (error) {
            console.error('Error saving item:', error);
            alert('Failed to save item');
        }
    };

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('name', newCategoryName);
            formData.append('isAvailable', String(categoryAvailable));
            formData.append('availability', JSON.stringify({ start: categoryStart, end: categoryEnd }));

            // Parse comma separated subcats
            const subCatsArray = categorySubCats.split(',').map(s => s.trim()).filter(Boolean);
            formData.append('subCategories', JSON.stringify(subCatsArray));

            // Parse Pincodes
            const pincodesArray = categoryPincodes.split(',').map(p => p.trim()).filter(Boolean);
            formData.append('availablePincodes', JSON.stringify(pincodesArray));

            if (categoryImage) {
                formData.append('image', categoryImage);
            }

            await api.post('/menu/categories', formData);
            alert('Category added successfully');
            setNewCategoryName('');
            setCategoryAvailable(true);
            setCategoryPincodes(''); // Reset
            setCategoryStart('');
            setCategoryEnd('');
            setCategorySubCats('');
            setCategoryImage(null);
            fetchData();
        } catch (error: any) {
            console.error('Error adding category:', error);
            alert(error.response?.data?.message || 'Failed to add category');
        }
    };

    const handleEditCategory = (category: Category) => {
        setEditingCategory(category);
        setNewCategoryName(category.name);
        setCategoryAvailable(category.isAvailable !== undefined ? category.isAvailable : true);
        setCategoryPincodes(category.availablePincodes?.join(', ') || ''); // Set State
        setCategoryStart(category.availability?.start || '');
        setCategoryEnd(category.availability?.end || '');
        setCategorySubCats(category.subCategories?.join(', ') || '');
        setCategoryImage(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEditCategory = () => {
        setEditingCategory(null);
        setNewCategoryName('');
        setCategoryAvailable(true);
        setCategoryPincodes(''); // Reset
        setCategoryStart('');
        setCategoryEnd('');
        setCategorySubCats('');
        setCategoryImage(null);
    };

    const handleUpdateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCategory) return;

        try {
            const formData = new FormData();
            formData.append('name', newCategoryName);
            formData.append('isAvailable', String(categoryAvailable));
            formData.append('availability', JSON.stringify({ start: categoryStart, end: categoryEnd }));

            const subCatsArray = categorySubCats.split(',').map(s => s.trim()).filter(Boolean);
            formData.append('subCategories', JSON.stringify(subCatsArray));

            const pincodesArray = categoryPincodes.split(',').map(p => p.trim()).filter(Boolean);
            formData.append('availablePincodes', JSON.stringify(pincodesArray));

            if (categoryImage) {
                formData.append('image', categoryImage);
            }

            await api.put(`/menu/categories/${editingCategory._id}`, formData);
            alert('Category updated successfully');
            setEditingCategory(null);
            setNewCategoryName('');
            setCategoryAvailable(true);
            setCategoryPincodes(''); // Reset
            setCategoryStart('');
            setCategoryEnd('');
            setCategoryImage(null);
            fetchData();
        } catch (error) {
            console.error('Error updating category:', error);
            alert('Failed to update category');
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (!confirm('Are you sure? This will delete the category.')) return;
        try {
            await api.delete(`/menu/categories/${id}`);
            alert('Category deleted');
            fetchData();
        } catch (error) {
            console.error('Error deleting category:', error);
            alert('Failed to delete category');
        }
    };

    if (loading) return <div className="p-8">Loading Menu Management...</div>;

    return (
        <div className="container py-6 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Menu Management</h1>

            <div className="grid lg:grid-cols-3 gap-8 mb-10">
                {/* Add Category Section */}
                <div className="p-6 border rounded-lg shadow-sm bg-card lg:col-span-1 h-fit">
                    <h2 className="text-xl font-semibold mb-4 text-foreground">Add Category</h2>
                    <form onSubmit={editingCategory ? handleUpdateCategory : handleAddCategory} className="space-y-4">
                        <div>
                            <div className="flex justify-between items-center mb-1.5">
                                <label className="block text-sm font-medium text-muted-foreground">
                                    {editingCategory ? 'Edit Name' : 'Category Name'}
                                </label>
                                {editingCategory && (
                                    <button
                                        type="button"
                                        onClick={cancelEditCategory}
                                        className="text-xs text-red-500 hover:text-red-700"
                                    >
                                        Cancel Edit
                                    </button>
                                )}
                            </div>
                            <input
                                type="text"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                className="w-full p-2 border rounded-md bg-background focus:ring-2 focus:ring-primary mb-3"
                                placeholder="e.g., Burgers"
                                required
                            />

                            <label className="flex items-center cursor-pointer gap-2 mb-3 bg-muted/30 p-2 rounded-md">
                                <input
                                    type="checkbox"
                                    checked={categoryAvailable}
                                    onChange={(e) => setCategoryAvailable(e.target.checked)}
                                    className="w-4 h-4 text-primary focus:ring-primary"
                                />
                                <span className="text-sm font-medium">Available (In Stock)</span>
                            </label>

                            {/* Replaces Long Distance Checkbox with Pincode List */}
                            <div className="mb-3">
                                <label className="block text-sm font-medium mb-1.5 text-muted-foreground">
                                    Allowed Pincodes
                                    <span className="text-xs font-normal text-muted-foreground ml-1">(Optional)</span>
                                </label>
                                <textarea
                                    value={categoryPincodes}
                                    onChange={(e) => setCategoryPincodes(e.target.value)}
                                    className="w-full p-2 border rounded-md bg-background focus:ring-2 focus:ring-primary text-sm min-h-[60px]"
                                    placeholder="e.g., 110059, 110078. Leave empty for default Standard zones."
                                />
                                <p className="text-[10px] text-muted-foreground mt-1">
                                    Only users in these pincodes will see this category.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mb-3">
                                <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">Available From</label>
                                    <input
                                        type="time"
                                        value={categoryStart}
                                        onChange={(e) => setCategoryStart(e.target.value)}
                                        className="w-full p-1.5 border rounded-md text-sm bg-background"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">Available Until</label>
                                    <input
                                        type="time"
                                        value={categoryEnd}
                                        onChange={(e) => setCategoryEnd(e.target.value)}
                                        className="w-full p-1.5 border rounded-md text-sm bg-background"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Sub-Categories (Optional)</label>
                                <input
                                    type="text"
                                    value={categorySubCats}
                                    onChange={(e) => setCategorySubCats(e.target.value)}
                                    className="w-full p-2 border rounded-md bg-background focus:ring-2 focus:ring-primary text-sm"
                                    placeholder="e.g., Veg, Non-Veg, Spacious (Comma separated)"
                                />
                                <p className="text-xs text-muted-foreground mt-1">Separate with commas</p>
                            </div>
                        </div>

                        <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Category Image (Optional)</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => e.target.files && setCategoryImage(e.target.files[0])}
                            className="w-full p-1.5 border rounded-md bg-background text-sm"
                        />

                        <button type="submit" className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors font-medium">
                            {editingCategory ? 'Update Category' : 'Create Category'}
                        </button>
                    </form>

                    {/* Categories List */}
                    <div className="mt-8 pt-6 border-t">
                        <h3 className="text-lg font-semibold mb-4">Existing Categories</h3>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                            {categories.map((cat) => (
                                <div key={cat._id} className="flex items-center justify-between p-2 border rounded-md bg-background text-sm hover:shadow-sm transition-shadow">
                                    <div className="flex flex-col">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="font-medium truncate max-w-[120px]">{cat.name}</span>
                                            {cat.availablePincodes && cat.availablePincodes.length > 0 && (
                                                <span className="text-[9px] bg-green-100 text-green-800 px-1 rounded w-fit border border-green-200">
                                                    {cat.availablePincodes.length} Pincodes
                                                </span>
                                            )}
                                        </div>
                                        {!cat.isAvailable && <span className="text-[10px] text-red-500 font-bold">Unavailable</span>}
                                        {cat.isAvailable && cat.availability?.start && <span className="text-[10px] text-muted-foreground">{cat.availability.start} - {cat.availability.end}</span>}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEditCategory(cat)}
                                            className="text-blue-600 hover:text-blue-800 text-xs px-1.5 py-0.5 bg-blue-50 rounded"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteCategory(cat._id)}
                                            className="text-red-600 hover:text-red-800 text-xs px-1.5 py-0.5 bg-red-50 rounded"
                                        >
                                            Del
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {categories.length === 0 && <p className="text-xs text-muted-foreground">No categories found.</p>}
                        </div>
                    </div>
                </div>

                {/* Add/Edit Item Section */}
                <div className="p-6 border rounded-lg shadow-sm bg-card lg:col-span-2">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-foreground">
                            {editingId ? 'Edit Menu Item' : 'Add Menu Item'}
                        </h2>
                        {editingId && (
                            <button onClick={resetForm} className="text-sm text-red-600 hover:text-red-800">
                                Cancel Edit
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleSubmitItem} className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Item Name</label>
                                <input
                                    type="text"
                                    value={newItem.name}
                                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                    className="w-full p-2 border rounded-md bg-background focus:ring-2 focus:ring-primary"
                                    placeholder="e.g., Cheese Burger"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Price (₹)</label>
                                <input
                                    type="number"
                                    value={newItem.price}
                                    onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                                    className="w-full p-2 border rounded-md bg-background focus:ring-2 focus:ring-primary"
                                    placeholder="199"
                                    required
                                />
                            </div>
                        </div>

                        {/* Variants Section */}
                        <div className="border p-4 rounded-md bg-muted/20">
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-foreground">Variants (Optional)</label>
                                <button
                                    type="button"
                                    onClick={handleAddVariant}
                                    className="text-xs text-primary hover:underline"
                                >
                                    + Add Variant
                                </button>
                            </div>
                            {newItem.variants.map((variant, index) => (
                                <div key={index} className="flex gap-2 mb-2 items-center">
                                    <input
                                        type="text"
                                        placeholder="Name (e.g., Half)"
                                        value={variant.name}
                                        onChange={(e) => handleVariantChange(index, 'name', e.target.value)}
                                        className="flex-1 p-2 border rounded-md text-sm"
                                        required
                                    />
                                    <input
                                        type="number"
                                        placeholder="Price"
                                        value={variant.price}
                                        onChange={(e) => handleVariantChange(index, 'price', Number(e.target.value))}
                                        className="w-24 p-2 border rounded-md text-sm"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveVariant(index)}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                    </button>
                                </div>
                            ))}
                            {newItem.variants.length === 0 && <p className="text-xs text-muted-foreground">No variants added. Standard price applies.</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Description</label>
                            <textarea
                                value={newItem.description}
                                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                className="w-full p-2 border rounded-md bg-background focus:ring-2 focus:ring-primary min-h-[80px]"
                                placeholder="Brief description of the item..."
                                required
                            />
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Category</label>
                                <select
                                    value={newItem.category}
                                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                                    className="w-full p-2 border rounded-md bg-background focus:ring-2 focus:ring-primary"
                                    required
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(cat => (
                                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* SubCategory Selection - Dependent on Category */}
                            <div>
                                <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Sub-Category</label>
                                <select
                                    value={newItem.subCategory}
                                    onChange={(e) => setNewItem({ ...newItem, subCategory: e.target.value })}
                                    className="w-full p-2 border rounded-md bg-background focus:ring-2 focus:ring-primary"
                                    disabled={!newItem.category}
                                >
                                    <option value="">Select Sub-Category (Optional)</option>
                                    {newItem.category && categories.find(c => c._id === newItem.category)?.subCategories?.map((sub, idx) => (
                                        <option key={idx} value={sub}>{sub}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Image</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="w-full p-1.5 border rounded-md bg-background text-sm"
                                />
                                {editingId && !imageFile && (
                                    <p className="text-xs text-muted-foreground mt-1">Leave empty to keep current image</p>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-6 pt-2">
                            <div className="flex bg-muted/30 p-2 rounded-md gap-4">
                                <label className="flex items-center cursor-pointer gap-2">
                                    <input
                                        type="radio"
                                        name="veg"
                                        checked={newItem.isVeg}
                                        onChange={() => setNewItem({ ...newItem, isVeg: true })}
                                        className="w-4 h-4 text-green-600 focus:ring-green-500"
                                    />
                                    <span className="text-sm font-medium text-green-700">Veg</span>
                                </label>
                                <label className="flex items-center cursor-pointer gap-2">
                                    <input
                                        type="radio"
                                        name="veg"
                                        checked={!newItem.isVeg}
                                        onChange={() => setNewItem({ ...newItem, isVeg: false })}
                                        className="w-4 h-4 text-red-600 focus:ring-red-500"
                                    />
                                    <span className="text-sm font-medium text-red-700">Non-Veg</span>
                                </label>
                            </div>

                            <label className="flex items-center cursor-pointer gap-2 bg-muted/30 p-2 rounded-md px-4">
                                <input
                                    type="checkbox"
                                    checked={newItem.isAvailable}
                                    onChange={(e) => setNewItem({ ...newItem, isAvailable: e.target.checked })}
                                    className="w-4 h-4 text-primary focus:ring-primary"
                                />
                                <span className="text-sm font-medium">Available to Order</span>
                            </label>
                        </div>

                        <button type="submit" className="bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90 transition-colors font-medium">
                            {editingId ? 'Update Item' : 'Add Item'}
                        </button>
                    </form>
                </div>
            </div >

            {/* Menu Items List */}
            < div className="border rounded-lg shadow-sm bg-card overflow-hidden" >
                <div className="p-6 border-b">
                    <h2 className="text-xl font-bold text-foreground">All Menu Items</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-muted/50 text-muted-foreground font-medium">
                            <tr>
                                <th className="p-4">Image</th>
                                <th className="p-4">Name</th>
                                <th className="p-4">Category</th>
                                <th className="p-4">Price</th>
                                <th className="p-4">Type</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {items.map((item) => (
                                <tr key={item._id} className="hover:bg-muted/50 transition-colors">
                                    <td className="p-4">
                                        {item.image ? (
                                            <img
                                                src={item.image.startsWith('http') ? item.image : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${item.image}`}
                                                alt={item.name}
                                                className="w-12 h-12 object-cover rounded-md"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = 'https://placehold.co/100?text=Food';
                                                }}
                                            />
                                        ) : (
                                            <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center text-xs text-gray-500">No Img</div>
                                        )}
                                    </td>
                                    <td className="p-4 font-medium text-foreground">{item.name}</td>
                                    <td className="p-4 text-muted-foreground">
                                        {typeof item.category === 'object' ? item.category?.name : 'Uncategorized'}
                                    </td>
                                    <td className="p-4 font-medium">₹{item.price}</td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.isVeg
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                            }`}>
                                            {item.isVeg ? 'Veg' : 'Non-Veg'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.isAvailable
                                            ? 'bg-blue-100 text-blue-800'
                                            : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {item.isAvailable ? 'Available' : 'Unavailable'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEditClick(item)}
                                                className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded hover:bg-blue-100"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(item._id)}
                                                className="px-2 py-1 text-xs font-medium text-red-700 bg-red-50 rounded hover:bg-red-100"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {items.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                                        No menu items found. Start by adding a category and then an item.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div >
        </div >
    );
}
