const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const router = express.Router();

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

/**
 * Backend IPFS Upload Proxy
 * Use this if you want server-side control over IPFS uploads
 */
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (!allowedTypes.includes(req.file.mimetype)) {
            return res.status(400).json({ error: 'Invalid file type' });
        }

        // Prepare form data for Pinata
        const formData = new FormData();
        formData.append('file', req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype
        });

        // Add metadata
        const metadata = {
            name: req.file.originalname,
            keyvalues: {
                uploadedBy: req.user?.id || 'anonymous',
                uploadedAt: new Date().toISOString(),
                fileSize: req.file.size.toString(),
                fileType: req.file.mimetype,
                ...req.body.metadata // Additional metadata from request
            }
        };

        formData.append('pinataMetadata', JSON.stringify(metadata));

        // Pin options
        const pinataOptions = {
            cidVersion: 1
        };

        formData.append('pinataOptions', JSON.stringify(pinataOptions));

        // Upload to Pinata
        const pinataResponse = await axios.post(
            'https://api.pinata.cloud/pinning/pinFileToIPFS',
            formData,
            {
                headers: {
                    ...formData.getHeaders(),
                    'pinata_api_key': process.env.PINATA_API_KEY,
                    'pinata_secret_api_key': process.env.PINATA_API_SECRET
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            }
        );

        const ipfsHash = pinataResponse.data.IpfsHash;
        const fileUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

        // Optional: Store in your database
        // await storeFileRecord({
        //   ipfsHash,
        //   originalName: req.file.originalname,
        //   fileSize: req.file.size,
        //   uploadedBy: req.user?.id
        // });

        res.json({
            success: true,
            ipfsHash,
            fileUrl,
            pinSize: pinataResponse.data.PinSize,
            timestamp: pinataResponse.data.Timestamp
        });

    } catch (error) {
        console.error('IPFS Upload Error:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Failed to upload to IPFS',
            details: error.response?.data?.error || error.message
        });
    }
});

/**
 * Get file metadata from IPFS
 */
router.get('/metadata/:hash', async (req, res) => {
    try {
        const { hash } = req.params;

        const response = await axios.get(
            `https://api.pinata.cloud/data/pinList?hashContains=${hash}`,
            {
                headers: {
                    'pinata_api_key': process.env.PINATA_API_KEY,
                    'pinata_secret_api_key': process.env.PINATA_API_SECRET
                }
            }
        );

        const fileData = response.data.rows[0];
        if (!fileData) {
            return res.status(404).json({ error: 'File not found' });
        }

        res.json({
            ipfsHash: fileData.ipfs_pin_hash,
            size: fileData.size,
            timestamp: fileData.date_pinned,
            metadata: fileData.metadata
        });

    } catch (error) {
        console.error('IPFS Metadata Error:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Failed to get file metadata',
            details: error.response?.data?.error || error.message
        });
    }
});

/**
 * List files with filters
 */
router.get('/files', async (req, res) => {
    try {
        const { type, limit = 10, offset = 0 } = req.query;

        const params = new URLSearchParams({
            pageLimit: limit.toString(),
            pageOffset: offset.toString(),
            status: 'pinned'
        });

        if (type) {
            params.append('metadata[keyvalues][type]', type);
        }

        const response = await axios.get(
            `https://api.pinata.cloud/data/pinList?${params.toString()}`,
            {
                headers: {
                    'pinata_api_key': process.env.PINATA_API_KEY,
                    'pinata_secret_api_key': process.env.PINATA_API_SECRET
                }
            }
        );

        const files = response.data.rows.map(file => ({
            ipfsHash: file.ipfs_pin_hash,
            size: file.size,
            timestamp: file.date_pinned,
            metadata: file.metadata,
            url: `https://gateway.pinata.cloud/ipfs/${file.ipfs_pin_hash}`
        }));

        res.json({
            files,
            count: response.data.count
        });

    } catch (error) {
        console.error('IPFS List Error:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Failed to list files',
            details: error.response?.data?.error || error.message
        });
    }
});

/**
 * Delete/unpin file from IPFS
 */
router.delete('/:hash', async (req, res) => {
    try {
        const { hash } = req.params;

        await axios.delete(
            `https://api.pinata.cloud/pinning/unpin/${hash}`,
            {
                headers: {
                    'pinata_api_key': process.env.PINATA_API_KEY,
                    'pinata_secret_api_key': process.env.PINATA_API_SECRET
                }
            }
        );

        res.json({ success: true, message: 'File unpinned from IPFS' });

    } catch (error) {
        console.error('IPFS Unpin Error:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Failed to unpin file',
            details: error.response?.data?.error || error.message
        });
    }
});

module.exports = router; 