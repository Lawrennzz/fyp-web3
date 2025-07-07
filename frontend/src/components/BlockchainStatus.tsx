import React from 'react';
import { IoCheckmarkCircle, IoCloseCircle, IoWarning } from 'react-icons/io5';

type StatusType = 'registered' | 'not-registered' | 'duplicate' | 'error';

interface BlockchainStatusProps {
    status: StatusType;
    id?: string;
    className?: string;
}

const BlockchainStatus: React.FC<BlockchainStatusProps> = ({ status, id, className = '' }) => {
    const getStatusDisplay = () => {
        switch (status) {
            case 'registered':
                return {
                    icon: <IoCheckmarkCircle className="text-green-500 mr-2" />,
                    text: 'Registered on Blockchain',
                    idDisplay: id ? `(ID: ${id})` : '',
                    textColor: 'text-green-500'
                };
            case 'not-registered':
                return {
                    icon: <IoCloseCircle className="text-gray-400 mr-2" />,
                    text: 'Not Registered',
                    idDisplay: '',
                    textColor: 'text-gray-400'
                };
            case 'duplicate':
                return {
                    icon: <IoWarning className="text-yellow-500 mr-2" />,
                    text: 'Duplicate Registration',
                    idDisplay: id ? `(ID: ${id})` : '',
                    textColor: 'text-yellow-500'
                };
            case 'error':
                return {
                    icon: <IoWarning className="text-red-500 mr-2" />,
                    text: 'Registration Error',
                    idDisplay: '',
                    textColor: 'text-red-500'
                };
            default:
                return {
                    icon: <IoCloseCircle className="text-gray-400 mr-2" />,
                    text: 'Unknown Status',
                    idDisplay: '',
                    textColor: 'text-gray-400'
                };
        }
    };

    const { icon, text, idDisplay, textColor } = getStatusDisplay();

    return (
        <div className={`flex items-center ${className}`}>
            {icon}
            <span className={`${textColor} text-sm`}>
                {text} <span className="opacity-75">{idDisplay}</span>
            </span>
        </div>
    );
};

export default BlockchainStatus; 