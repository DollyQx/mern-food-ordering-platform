export function getImageUrl(path: string | undefined, options?: { w?: number; h?: number }): string {
    if (!path) return '';

    // Handle Cloudinary URLs
    if (path.includes('res.cloudinary.com')) {
        return path;
    }

    if (path.startsWith('http')) return path;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    // Remove /api if present to get base URL, assuming uploads are at root/uploads
    // But typically static files are served relative to root. 
    // If backend serves uploads at /uploads, and API is at /api
    // We might need to adjust. 
    // Based on app.ts: app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
    // So http://localhost:5000/uploads/file.jpg is correct.

    // Remove '/api' from the end of API URL if it exists to get the base origin
    const baseUrl = apiUrl.replace(/\/api$/, '');

    // Ensure path starts with / if not present
    const cleanPath = path.startsWith('/') ? path : `/${path}`;

    return `${baseUrl}${cleanPath}`;
}
