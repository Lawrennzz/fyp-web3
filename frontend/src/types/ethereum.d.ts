interface Window {
  ethereum?: {
    isMetaMask?: boolean;
    request: (args: { method: string; params?: any[] }) => Promise<any>;
    on: (event: string, callback: (params: any) => void) => void;
    removeListener: (event: string, callback: (params: any) => void) => void;
    selectedAddress: string | null;
    chainId: string;
  };
}

declare module 'qrcode.react' {
  interface QRCodeProps {
    value: string;
    renderAs?: 'canvas' | 'svg';
    size?: number;
    level?: 'L' | 'M' | 'Q' | 'H';
    includeMargin?: boolean;
    imageSettings?: {
      src: string;
      height: number;
      width: number;
      excavate: boolean;
    };
  }

  const QRCode: React.FC<QRCodeProps>;
  export default QRCode;
} 