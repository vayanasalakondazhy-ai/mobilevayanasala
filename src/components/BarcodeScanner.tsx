import { Html5QrcodeScanner } from 'html5-qrcode';
import { useEffect, useRef } from 'react';
import { playBeep } from '../lib/audio';

interface BarcodeScannerProps {
  onScan: (isbn: string) => void;
  isScanning: boolean;
}

export default function BarcodeScanner({ onScan, isScanning }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (isScanning && !scannerRef.current) {
      const scanner = new Html5QrcodeScanner(
        "reader",
        { 
          fps: 10, 
          qrbox: { width: 250, height: 150 },
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true,
        },
        /* verbose= */ false
      );

      scanner.render((decodedText) => {
        playBeep();
        onScan(decodedText);
      }, (error) => {
        // ignore errors
      });

      scannerRef.current = scanner;
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error("Error clearing scanner", err));
        scannerRef.current = null;
      }
    };
  }, [isScanning, onScan]);

  return (
    <div className="w-full max-w-md mx-auto overflow-hidden rounded-lg border-2 border-brand bg-black relative shadow-lg">
      <div id="reader" className="w-full min-h-[160px] flex items-center justify-center">
        {!isScanning && (
          <div className="p-8 text-center text-white/50 text-xs font-bold uppercase tracking-widest">
            Scanner is off
          </div>
        )}
      </div>
    </div>
  );
}
