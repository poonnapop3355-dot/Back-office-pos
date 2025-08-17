
import React, { useEffect, useMemo } from 'react';

interface QrCodeProps {
  url: string;
  size?: number;
}

const QrCode: React.FC<QrCodeProps> = ({ url, size = 64 }) => {
  const qrCodeDataUrl = useMemo(() => {
    if (!url) return '';
    try {
        // @ts-ignore
        const qr = qrcode(0, 'L');
        qr.addData(url);
        qr.make();
        return qr.createDataURL(4, 0);
    } catch (e) {
        console.error('QR Code generation failed:', e);
        return '';
    }
  }, [url]);

  if (!qrCodeDataUrl) return null;

  return <img src={qrCodeDataUrl} alt="QR Code" style={{ width: size, height: size }} />;
};

export default QrCode;
