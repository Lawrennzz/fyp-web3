/**
 * Helper functions for the application
 */

/**
 * Format a date string or timestamp to a readable format
 * @param dateInput Date string, timestamp, or Date object
 * @returns Formatted date string
 */
export function formatDate(dateInput: string | number | Date | any): string {
    if (!dateInput) return 'N/A';

    let date: Date;

    if (dateInput instanceof Date) {
        date = dateInput;
    } else if (typeof dateInput === 'string') {
        date = new Date(dateInput);
    } else if (typeof dateInput === 'number') {
        date = new Date(dateInput);
    } else if (typeof dateInput === 'object' && 'toDate' in dateInput && typeof dateInput.toDate === 'function') {
        // Handle Firestore timestamp
        date = dateInput.toDate();
    } else {
        return 'Invalid date';
    }

    if (isNaN(date.getTime())) {
        return 'Invalid date';
    }

    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Format currency value
 * @param value Number to format
 * @param currency Currency code
 * @returns Formatted currency string
 */
export function formatCurrency(value: number, currency: string = 'USDT'): string {
    return `${value} ${currency}`;
}

/**
 * Truncate text with ellipsis
 * @param text Text to truncate
 * @param maxLength Maximum length before truncating
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number): string {
    if (!text || text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
}

/**
 * Format an Ethereum address for display
 * @param address Ethereum address
 * @returns Formatted address (e.g. 0x1234...5678)
 */
export function formatAddress(address: string): string {
    if (!address) return '';
    if (address.length < 10) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

/**
 * Generate a random ID
 * @param length Length of the ID
 * @returns Random ID string
 */
export function generateId(length: number = 10): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Calculate the number of nights between two dates
 * @param checkIn Check-in date
 * @param checkOut Check-out date
 * @returns Number of nights
 */
export function calculateNights(checkIn: Date, checkOut: Date): number {
    if (!checkIn || !checkOut) return 0;
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Check if a value is empty (null, undefined, empty string, empty array, or empty object)
 * @param value Value to check
 * @returns True if empty, false otherwise
 */
export function isEmpty(value: any): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string' && value.trim() === '') return true;
    if (Array.isArray(value) && value.length === 0) return true;
    if (typeof value === 'object' && Object.keys(value).length === 0) return true;
    return false;
} 