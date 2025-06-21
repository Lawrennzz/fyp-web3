import React, { useState } from 'react';
import { NextPage } from 'next';
import Layout from '../../components/Layout';
import IPFSUploader from '../../components/IPFSUploader';
import { ipfsService } from '../../utils/ipfs';

const IPFSTestPage: NextPage = () => {
    const [uploadedFiles, setUploadedFiles] = useState<Array<{
        name: string;
        ipfsHash: string;
        url: string;
        uploadTime: string;
    }>>([]);
    const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

    React.useEffect(() => {
        checkIPFSConnection();
    }, []);

    const checkIPFSConnection = async () => {
        try {
            const isConnected = await ipfsService.testConnection();
            setConnectionStatus(isConnected ? 'connected' : 'disconnected');
        } catch (error) {
            setConnectionStatus('disconnected');
        }
    };

    const handleUploadSuccess = (ipfsHash: string, fileUrl: string) => {
        const newFile = {
            name: `File ${uploadedFiles.length + 1}`,
            ipfsHash,
            url: fileUrl,
            uploadTime: new Date().toLocaleString()
        };
        setUploadedFiles(prev => [...prev, newFile]);
    };

    const handleUploadError = (error: string) => {
        alert(`Upload failed: ${error}`);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    };

    return (
        <Layout>
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold text-gray-900 mb-8">
                        IPFS Storage Test
                    </h1>

                    {/* Connection Status */}
                    <div className="mb-8 p-4 rounded-lg border">
                        <h2 className="text-lg font-semibold mb-2">Connection Status</h2>
                        <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full mr-2 ${connectionStatus === 'connected' ? 'bg-green-500' :
                                    connectionStatus === 'disconnected' ? 'bg-red-500' : 'bg-yellow-500'
                                }`} />
                            <span className="text-sm">
                                {connectionStatus === 'connected' && 'Connected to IPFS via Pinata'}
                                {connectionStatus === 'disconnected' && 'Not connected to IPFS'}
                                {connectionStatus === 'checking' && 'Checking connection...'}
                            </span>
                            <button
                                onClick={checkIPFSConnection}
                                className="ml-4 px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                                Recheck
                            </button>
                        </div>
                    </div>

                    {connectionStatus === 'disconnected' && (
                        <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <h3 className="font-semibold text-yellow-800 mb-2">Setup Required</h3>
                            <p className="text-yellow-700 text-sm mb-3">
                                To use IPFS storage, you need to configure Pinata API credentials:
                            </p>
                            <ol className="text-sm text-yellow-700 space-y-1 ml-4">
                                <li>1. Create a free account at <a href="https://pinata.cloud" target="_blank" rel="noopener noreferrer" className="underline">pinata.cloud</a></li>
                                <li>2. Generate API keys in your Pinata dashboard</li>
                                <li>3. Add these environment variables to your .env.local file:</li>
                            </ol>
                            <pre className="mt-3 p-3 bg-gray-100 rounded text-xs">
                                {`NEXT_PUBLIC_PINATA_API_KEY=your_api_key
NEXT_PUBLIC_PINATA_API_SECRET=your_api_secret`}
                            </pre>
                        </div>
                    )}

                    {/* Upload Section */}
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold mb-4">Upload Files to IPFS</h2>
                        <IPFSUploader
                            onUploadSuccess={handleUploadSuccess}
                            onUploadError={handleUploadError}
                            acceptedTypes={['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain']}
                            maxFileSize={10}
                            uploadType="document"
                            metadata={{
                                description: 'Test upload from Travel.Go admin panel'
                            }}
                            className="max-w-lg"
                        />
                    </div>

                    {/* Uploaded Files */}
                    {uploadedFiles.length > 0 && (
                        <div className="mb-8">
                            <h2 className="text-xl font-semibold mb-4">Uploaded Files</h2>
                            <div className="space-y-4">
                                {uploadedFiles.map((file, index) => (
                                    <div key={index} className="border rounded-lg p-4 bg-gray-50">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className="font-medium text-gray-900">{file.name}</h3>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    Uploaded: {file.uploadTime}
                                                </p>

                                                <div className="mt-2 space-y-2">
                                                    <div className="flex items-center">
                                                        <span className="text-xs font-medium text-gray-700 w-16">Hash:</span>
                                                        <code className="text-xs bg-gray-200 px-2 py-1 rounded mr-2">
                                                            {file.ipfsHash}
                                                        </code>
                                                        <button
                                                            onClick={() => copyToClipboard(file.ipfsHash)}
                                                            className="text-xs text-blue-600 hover:text-blue-800"
                                                        >
                                                            Copy
                                                        </button>
                                                    </div>

                                                    <div className="flex items-center">
                                                        <span className="text-xs font-medium text-gray-700 w-16">URL:</span>
                                                        <code className="text-xs bg-gray-200 px-2 py-1 rounded mr-2 truncate max-w-md">
                                                            {file.url}
                                                        </code>
                                                        <button
                                                            onClick={() => copyToClipboard(file.url)}
                                                            className="text-xs text-blue-600 hover:text-blue-800 mr-2"
                                                        >
                                                            Copy
                                                        </button>
                                                        <a
                                                            href={file.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs text-green-600 hover:text-green-800"
                                                        >
                                                            View
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* IPFS Information */}
                    <div className="bg-blue-50 rounded-lg p-6">
                        <h2 className="text-lg font-semibold text-blue-900 mb-3">
                            About IPFS in Travel.Go
                        </h2>
                        <div className="text-sm text-blue-800 space-y-2">
                            <p>
                                <strong>IPFS (InterPlanetary File System)</strong> is a distributed system for storing and accessing files,
                                similar to blockchain technology. It provides decentralized storage for your Travel.Go platform.
                            </p>
                            <p>
                                <strong>Use cases in Travel.Go:</strong>
                            </p>
                            <ul className="list-disc list-inside ml-4 space-y-1">
                                <li>Hotel images and photo galleries</li>
                                <li>Room photos and virtual tours</li>
                                <li>Booking confirmations and receipts</li>
                                <li>User profile pictures</li>
                                <li>Hotel documentation and certificates</li>
                                <li>Metadata for smart contracts</li>
                            </ul>
                            <p>
                                <strong>Benefits:</strong>
                            </p>
                            <ul className="list-disc list-inside ml-4 space-y-1">
                                <li>Permanent storage - files cannot be deleted</li>
                                <li>Decentralized - no single point of failure</li>
                                <li>Content-addressed - each file has a unique hash</li>
                                <li>Tamper-proof - content integrity verification</li>
                                <li>Global accessibility - files available worldwide</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default IPFSTestPage; 