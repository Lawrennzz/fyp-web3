import { useEffect } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';

export default function Scanner() {
    useEffect(() => {
        // Redirect to the scanner page
        window.location.href = 'http://localhost:8080/scanner.html';
    }, []);

    return (
        <Layout>
            <Head>
                <title>QR Code Scanner</title>
                <meta name="description" content="Scan booking QR codes" />
            </Head>
            <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
                <div className="bg-[#1E293B] rounded-xl p-8 max-w-md w-full text-center">
                    <h1 className="text-2xl font-bold mb-4">QR Code Scanner</h1>
                    <p className="text-gray-400 mb-6">Redirecting to scanner page...</p>
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="text-gray-400 mt-6">
                        If you are not redirected automatically, please{' '}
                        <a
                            href="http://localhost:8080/scanner.html"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-400"
                        >
                            click here
                        </a>
                    </p>
                </div>
            </div>
        </Layout>
    );
} 