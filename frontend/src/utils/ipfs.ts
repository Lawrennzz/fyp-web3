import axios from 'axios';

interface PinataConfig {
    apiKey: string;
    apiSecret: string;
    baseUrl: string;
}

interface IPFSUploadResult {
    IpfsHash: string;
    PinSize: number;
    Timestamp: string;
    isDuplicate?: boolean;
}

interface FileUploadOptions {
    name?: string;
    metadata?: {
        hotelId?: string;
        roomId?: string;
        userId?: string;
        type?: 'hotel-image' | 'room-image' | 'document' | 'profile';
        description?: string;
    };
}

class IPFSService {
    private config: PinataConfig;

    constructor() {
        this.config = {
            apiKey: process.env.NEXT_PUBLIC_PINATA_API_KEY || '',
            apiSecret: process.env.NEXT_PUBLIC_PINATA_API_SECRET || '',
            baseUrl: 'https://api.pinata.cloud'
        };

        if (!this.config.apiKey || !this.config.apiSecret) {
            console.warn('IPFS Service: Pinata API credentials not found. IPFS functionality will be disabled.');
        }
    }

    /**
     * Upload a file to IPFS via Pinata
     */
    async uploadFile(file: File, options: FileUploadOptions = {}): Promise<IPFSUploadResult> {
        if (!this.isConfigured()) {
            throw new Error('IPFS service is not properly configured');
        }

        const formData = new FormData();
        formData.append('file', file);

        // Add metadata
        const metadata = {
            name: options.name || file.name,
            keyvalues: {
                ...options.metadata,
                uploadedAt: new Date().toISOString(),
                originalName: file.name,
                fileSize: file.size.toString(),
                fileType: file.type
            }
        };

        formData.append('pinataMetadata', JSON.stringify(metadata));

        // Pin options for better organization
        const pinataOptions = {
            cidVersion: 1,
            customPinPolicy: {
                regions: [
                    {
                        id: 'FRA1',
                        desiredReplicationCount: 2
                    },
                    {
                        id: 'NYC1',
                        desiredReplicationCount: 2
                    }
                ]
            }
        };

        formData.append('pinataOptions', JSON.stringify(pinataOptions));

        try {
            const response = await axios.post(
                `${this.config.baseUrl}/pinning/pinFileToIPFS`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'pinata_api_key': this.config.apiKey,
                        'pinata_secret_api_key': this.config.apiSecret
                    },
                    maxContentLength: Infinity,
                    maxBodyLength: Infinity
                }
            );

            return response.data;
        } catch (error: any) {
            console.error('IPFS Upload Error:', error.response?.data || error.message);
            throw new Error(`Failed to upload to IPFS: ${error.response?.data?.error || error.message}`);
        }
    }

    /**
     * Upload JSON data to IPFS
     */
    async uploadJSON(data: any, options: FileUploadOptions = {}): Promise<IPFSUploadResult> {
        if (!this.isConfigured()) {
            throw new Error('IPFS service is not properly configured');
        }

        const metadata = {
            name: options.name || 'json-data',
            keyvalues: {
                ...options.metadata,
                uploadedAt: new Date().toISOString(),
                dataType: 'json'
            }
        };

        const pinataOptions = {
            cidVersion: 1
        };

        try {
            const response = await axios.post(
                `${this.config.baseUrl}/pinning/pinJSONToIPFS`,
                {
                    pinataContent: data,
                    pinataMetadata: metadata,
                    pinataOptions: pinataOptions
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'pinata_api_key': this.config.apiKey,
                        'pinata_secret_api_key': this.config.apiSecret
                    }
                }
            );

            return response.data;
        } catch (error: any) {
            console.error('IPFS JSON Upload Error:', error.response?.data || error.message);
            throw new Error(`Failed to upload JSON to IPFS: ${error.response?.data?.error || error.message}`);
        }
    }

    /**
     * Get file from IPFS using hash
     */
    getFileUrl(ipfsHash: string, gateway: string = 'https://gateway.pinata.cloud'): string {
        return `${gateway}/ipfs/${ipfsHash}`;
    }

    /**
     * Get file metadata from Pinata
     */
    async getFileMetadata(ipfsHash: string): Promise<any> {
        if (!this.isConfigured()) {
            throw new Error('IPFS service is not properly configured');
        }

        try {
            const response = await axios.get(
                `${this.config.baseUrl}/data/pinList?hashContains=${ipfsHash}`,
                {
                    headers: {
                        'pinata_api_key': this.config.apiKey,
                        'pinata_secret_api_key': this.config.apiSecret
                    }
                }
            );

            return response.data.rows[0] || null;
        } catch (error: any) {
            console.error('IPFS Metadata Error:', error.response?.data || error.message);
            throw new Error(`Failed to get file metadata: ${error.response?.data?.error || error.message}`);
        }
    }

    /**
     * Unpin file from IPFS (remove from Pinata)
     */
    async unpinFile(ipfsHash: string): Promise<void> {
        if (!this.isConfigured()) {
            throw new Error('IPFS service is not properly configured');
        }

        try {
            await axios.delete(
                `${this.config.baseUrl}/pinning/unpin/${ipfsHash}`,
                {
                    headers: {
                        'pinata_api_key': this.config.apiKey,
                        'pinata_secret_api_key': this.config.apiSecret
                    }
                }
            );
        } catch (error: any) {
            console.error('IPFS Unpin Error:', error.response?.data || error.message);
            throw new Error(`Failed to unpin file: ${error.response?.data?.error || error.message}`);
        }
    }

    /**
     * List all pinned files
     */
    async listPinnedFiles(filters: {
        status?: 'pinned' | 'unpinned';
        pageLimit?: number;
        pageOffset?: number;
        metadata?: any;
    } = {}): Promise<any> {
        if (!this.isConfigured()) {
            throw new Error('IPFS service is not properly configured');
        }

        const params = new URLSearchParams();
        if (filters.status) params.append('status', filters.status);
        if (filters.pageLimit) params.append('pageLimit', filters.pageLimit.toString());
        if (filters.pageOffset) params.append('pageOffset', filters.pageOffset.toString());
        if (filters.metadata) {
            Object.entries(filters.metadata).forEach(([key, value]) => {
                params.append(`metadata[keyvalues][${key}]`, value as string);
            });
        }

        try {
            const response = await axios.get(
                `${this.config.baseUrl}/data/pinList?${params.toString()}`,
                {
                    headers: {
                        'pinata_api_key': this.config.apiKey,
                        'pinata_secret_api_key': this.config.apiSecret
                    }
                }
            );

            return response.data;
        } catch (error: any) {
            console.error('IPFS List Error:', error.response?.data || error.message);
            throw new Error(`Failed to list files: ${error.response?.data?.error || error.message}`);
        }
    }

    /**
     * Check if IPFS service is properly configured
     */
    private isConfigured(): boolean {
        return !!(this.config.apiKey && this.config.apiSecret);
    }

    /**
     * Test IPFS connection
     */
    async testConnection(): Promise<boolean> {
        if (!this.isConfigured()) {
            return false;
        }

        try {
            await axios.get(
                `${this.config.baseUrl}/data/testAuthentication`,
                {
                    headers: {
                        'pinata_api_key': this.config.apiKey,
                        'pinata_secret_api_key': this.config.apiSecret
                    }
                }
            );
            return true;
        } catch (error) {
            console.error('IPFS Connection Test Failed:', error);
            return false;
        }
    }
}

// Export singleton instance
export const ipfsService = new IPFSService();
export default ipfsService; 