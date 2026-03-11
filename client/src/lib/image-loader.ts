'use client';

export default function imageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
    if (!src) return '';

    // Cloudinary Optimization
    if (src.includes('res.cloudinary.com')) {
        const params = ['f_auto', 'c_limit', `w_${width}`, `q_${quality || 'auto'}`];

        // If src already has transformations, we need to inject ours carefully
        // Pattern: /upload/v<version>/<id> or /upload/<existing_transforms>/v<version>/<id>

        const parts = src.split('/upload/');
        if (parts.length === 2) {
            return `${parts[0]}/upload/${params.join(',')}/${parts[1]}`;
        }
        return src;
    }

    // For local/other images, fallback to default Next.js optimization (which uses _next/image)
    // But wait, "loaderFile" overrides EVERYTHING.
    // If we return the src as-is for local, it won't be resized by Next.js!
    // It will be served raw.
    // So for local images, we actually want to point to the Next.js API if we want resizing,
    // OR we accept that local images are rare/small.
    // However, the prompt says "Images are hosted on Cloudinary". 
    // Let's assume Cloudinary is the main target.
    // For local images, usually we pass them through unless we have a specific resize logic.
    // Standard Next.js default loader logic isn't exposed perfectly to wrap.
    // BUT: user says "Images are hosted on Cloudinary".

    return src;
}
