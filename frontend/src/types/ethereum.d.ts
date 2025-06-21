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

export {}; 