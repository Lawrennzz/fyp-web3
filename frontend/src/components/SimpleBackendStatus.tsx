import { useState, useEffect } from 'react';

export default function SimpleBackendStatus() {
    const [status, setStatus] = useState<'loading' | 'connected' | 'disconnected'>('loading');
    const [isExpanded, setIsExpanded] = useState(false);
    const [details, setDetails] = useState({
        latency: 0,
        timestamp: '',
        uptime: 0
    });

    useEffect(() => {
        console.log('🔍 SimpleBackendStatus mounted');

        const checkStatus = async () => {
            try {
                const startTime = Date.now();
                const response = await fetch('http://localhost:3001/api/health');
                const latency = Date.now() - startTime;

                if (response.ok) {
                    const data = await response.json();
                    setStatus('connected');
                    setDetails({
                        latency,
                        timestamp: data.timestamp,
                        uptime: Math.round(data.uptime || 0)
                    });
                    console.log('✅ Backend status: connected, latency:', latency + 'ms');
                } else {
                    setStatus('disconnected');
                }
            } catch (error) {
                console.error('❌ Backend error:', error);
                setStatus('disconnected');
            }
        };

        checkStatus();
        const interval = setInterval(checkStatus, 10000);
        return () => clearInterval(interval);
    }, []);

    const getStatusColor = () => {
        switch (status) {
            case 'connected': return 'bg-green-500';
            case 'disconnected': return 'bg-red-500';
            default: return 'bg-yellow-500';
        }
    };

    const getStatusText = () => {
        switch (status) {
            case 'connected': return 'Backend Connected ✅';
            case 'disconnected': return 'Backend Disconnected ❌';
            default: return 'Backend Loading ⏳';
        }
    };

    return (
        <div
            className="fixed bottom-4 left-4 bg-gray-800 text-white rounded-lg shadow-lg border border-gray-600"
            style={{
                zIndex: 10000,
                minWidth: '200px',
                fontSize: '14px',
                fontWeight: 'bold'
            }}
        >
            {/* Main Status Bar - Clickable */}
            <div
                className="px-4 py-2 cursor-pointer hover:bg-gray-700 rounded-lg flex items-center justify-between"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor()}`}></div>
                    <span>{getStatusText()}</span>
                </div>
                <span className="text-gray-400 ml-2">
                    {isExpanded ? '▼' : '▶'}
                </span>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-600 mt-2 pt-2">
                    <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                            <span className="text-gray-400">Status:</span>
                            <span className={status === 'connected' ? 'text-green-400' : 'text-red-400'}>
                                {status === 'connected' ? 'Connected' : 'Disconnected'}
                            </span>
                        </div>

                        {status === 'connected' && (
                            <>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Latency:</span>
                                    <span className={details.latency < 100 ? 'text-green-400' : details.latency < 300 ? 'text-yellow-400' : 'text-red-400'}>
                                        {details.latency}ms
                                    </span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-gray-400">Uptime:</span>
                                    <span className="text-gray-200">{details.uptime}s</span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-gray-400">Last Check:</span>
                                    <span className="text-gray-200">
                                        {details.timestamp ? new Date(details.timestamp).toLocaleTimeString() : 'N/A'}
                                    </span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-gray-400">API URL:</span>
                                    <span className="text-gray-200 text-xs">localhost:3001</span>
                                </div>
                            </>
                        )}

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                window.location.reload();
                            }}
                            className="mt-2 w-full px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition-colors"
                        >
                            Refresh Connection
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
} 