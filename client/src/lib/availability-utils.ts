export interface CategoryAvailability {
    isAvailable?: boolean;
    isLongDistance?: boolean; // Added
    availablePincodes?: string[]; // Added: Explicit list
    availability?: {
        start: string;
        end: string;
    };
}

// Allow verified pincodes. 
// Standard: 110059, 110078, 110075 -> All items allowed.
// Extended: Any other 6 digit -> Only isLongDistance items allowed.
// Allow verified pincodes. 
// Standard: 110059, 110075, 110078, 110018, 110058, 110043 -> All items allowed.
// Extended: Any other 6 digit -> Only isLongDistance items allowed.
export const STANDARD_PINCODES = ['110059', '110075', '110078', '110018', '110058', '110043'];

/**
 * Checks if a category is currently available based on its explicit status and time window.
 * @param cat Category object containing availability info
 * @returns boolean
 */
export const isCategoryAvailable = (cat: CategoryAvailability | null | undefined): boolean => {
    if (!cat) return true; // Fail safe

    // 1. Check explicit switch
    if (cat.isAvailable === false) return false;

    // 2. Check Time Window
    if (cat.availability?.start && cat.availability?.end) {
        try {
            // Use IST (Asia/Kolkata) for consistency between Server (UTC) and Client (IST)
            const now = new Date();
            const istString = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
            const istDate = new Date(istString);

            // Fail-safe for invalid date parsing in some environments
            if (isNaN(istDate.getTime())) {
                console.warn("Invalid IST Date parsed, falling back to local time");
            }

            const targetDate = isNaN(istDate.getTime()) ? now : istDate;
            const currentMinutes = targetDate.getHours() * 60 + targetDate.getMinutes();

            if (!cat.availability.start.includes(':') || !cat.availability.end.includes(':')) return true;

            const [startH, startM] = cat.availability.start.split(':').map(Number);
            const [endH, endM] = cat.availability.end.split(':').map(Number);

            const startMinutes = startH * 60 + startM;
            const endMinutes = endH * 60 + endM;

            if (endMinutes < startMinutes) {
                // Overnight
                if (currentMinutes < startMinutes && currentMinutes > endMinutes) {
                    return false;
                }
            } else {
                // Standard day
                if (currentMinutes < startMinutes || currentMinutes > endMinutes) {
                    return false;
                }
            }
        } catch (e) {
            console.error("Error in isCategoryAvailable time check:", e);
            return true; // Fail open
        }
    }

    return true;
};

/**
 * Checks if item is deliverable to the given pincode
 * @param pincode User's pincode
 * @param isLongDistance Item/Category's isLongDistance flag
 * @returns { available: boolean, reason?: string }
 */
export const checkDeliverability = (pincode: string, isLongDistance: boolean = false): { available: boolean, reason?: string } => {
    if (!pincode) return { available: true }; // No pincode set yet, allow browsing (or prompt to set)

    // Standard Pincodes allow everything
    if (STANDARD_PINCODES.includes(pincode)) {
        return { available: true };
    }

    // Other Pincodes (Extended)
    if (pincode.length === 6 && /^\d+$/.test(pincode)) {
        // Only allow if item is Long Distance compatible
        if (isLongDistance) {
            return { available: true };
        } else {
            return { available: false, reason: `Not available in ${pincode}` };
        }
    }

    // Invalid Pincode
    return { available: false, reason: 'Invalid Pincode' };
};
