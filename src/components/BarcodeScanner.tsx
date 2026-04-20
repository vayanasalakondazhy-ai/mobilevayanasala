import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useEffect, useRef, useState } from 'react';
import { playBeep } from '../lib/audio';
import { Camera, Zap, ZapOff, RefreshCcw, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';

interface BarcodeScannerProps {
  onScan: (isbn: string) => void;
  isScanning: boolean;
}

export default function BarcodeScanner({ onScan, isScanning }: BarcodeScannerProps) {
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const lastScannedCode = useRef<string | null>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Get available cameras on mount
    Html5Qrcode.getCameras().then(devices => {
      if (devices && devices.length > 0) {
        setCameras(devices);
        // Try to find the back camera by default
        const backCameraIndex = devices.findIndex(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('rear')
        );
        if (backCameraIndex !== -1) {
          setCurrentCameraIndex(backCameraIndex);
        }
      }
    }).catch(err => {
      console.error("Error getting cameras", err);
      setError("Camera access denied or not found");
    });
  }, []);

  const startScanner = async (cameraId: string) => {
    if (!cameraId || !isScanning) return;
    
    setIsInitializing(true);
    setError(null);

    try {
      if (html5QrCodeRef.current) {
        await html5QrCodeRef.current.stop();
      }

      const html5QrCode = new Html5Qrcode("reader");
      html5QrCodeRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 150 },
        formatsToSupport: [ 
          Html5QrcodeSupportedFormats.EAN_13, 
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E
        ]
      };

      await html5QrCode.start(
        cameraId,
        config,
        (decodedText) => {
          // Throttle scans to avoid multiple triggers for the same code
          if (decodedText !== lastScannedCode.current) {
            lastScannedCode.current = decodedText;
            playBeep();
            onScan(decodedText);
            
            // Reset last scanned after 3 seconds
            if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
            scanTimeoutRef.current = setTimeout(() => {
              lastScannedCode.current = null;
            }, 3000);
          }
        },
        () => {} // Ignore scan errors
      );
      
      setIsInitializing(false);
    } catch (err) {
      console.error("Unable to start scanner", err);
      setError("Failed to start camera. Please check permissions.");
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    if (isScanning && cameras.length > 0) {
      startScanner(cameras[currentCameraIndex].id);
    } else if (!isScanning && html5QrCodeRef.current) {
      html5QrCodeRef.current.stop().catch(err => console.error("Error stopping", err));
    }

    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(err => console.error("Error stopping on cleanup", err));
      }
    };
  }, [isScanning, cameras, currentCameraIndex]);

  const toggleCamera = () => {
    if (cameras.length > 1) {
      setCurrentCameraIndex((prev) => (prev + 1) % cameras.length);
    }
  };

  const toggleTorch = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        const newState = !isTorchOn;
        // The type definition for html5-qrcode might be missing applyVideoConstraints on the instance?
        // Actually, it uses applyVideoConstraints on the track.
        // html5-qrcode provides a way via getRunningTrack()
        const track = (html5QrCodeRef.current as any).getRunningTrack();
        if (track && track.getCapabilities && track.getCapabilities().torch) {
          await track.applyConstraints({
            advanced: [{ torch: newState }]
          } as any);
          setIsTorchOn(newState);
        } else {
          toast.error("Torch not supported on this camera", {
            style: { fontSize: '12px', fontWeight: 'bold' }
          });
        }
      } catch (err) {
        console.error("Error toggling torch", err);
      }
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <div className="relative overflow-hidden rounded-2xl border-4 border-brand bg-slate-900 shadow-2xl aspect-[4/3] flex flex-col items-center justify-center">
        {/* Scanner Surface */}
        <div id="reader" className="w-full h-full object-cover"></div>

        {/* Overlay UI */}
        {!isScanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm z-10">
            <div className="w-16 h-16 rounded-full bg-brand/20 flex items-center justify-center mb-4">
              <Camera className="w-8 h-8 text-brand" />
            </div>
            <p className="text-white font-bold uppercase tracking-widest text-xs">Scanner Standby</p>
          </div>
        )}

        {isInitializing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-sm z-20">
            <Loader2 className="w-8 h-8 text-brand animate-spin mb-2" />
            <p className="text-white text-[10px] font-bold uppercase tracking-tight">Waking camera...</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/80 backdrop-blur-sm z-30 p-6 text-center">
            <p className="text-white text-xs font-bold leading-relaxed">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-white text-red-600 rounded-lg text-[10px] font-bold uppercase"
            >
              Retry & Refresh
            </button>
          </div>
        )}

        {/* Scanning Animation */}
        {isScanning && !isInitializing && (
          <div className="absolute inset-0 pointer-events-none z-10">
            <div className="scan-line"></div>
            <div className="absolute inset-0 border-[20px] border-slate-900/40"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[150px] border-2 border-brand rounded-lg shadow-[0_0_0_1000px_rgba(30,41,59,0.5)]"></div>
          </div>
        )}
      </div>

      {/* Manual Controls */}
      <div className="flex items-center justify-center gap-4">
        {cameras.length > 1 && (
          <button
            onClick={toggleCamera}
            disabled={!isScanning || isInitializing}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold text-[10px] uppercase tracking-widest transition-all hover:bg-slate-50",
              (!isScanning || isInitializing) && "opacity-50 grayscale"
            )}
          >
            <RefreshCcw className="w-4 h-4" />
            Switch Camera
          </button>
        )}
        
        <button
          onClick={toggleTorch}
          disabled={!isScanning || isInitializing}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold text-[10px] uppercase tracking-widest transition-all hover:bg-slate-50",
            isTorchOn && "bg-teal-50 border-brand text-brand",
            (!isScanning || isInitializing) && "opacity-50 grayscale"
          )}
        >
          {isTorchOn ? <Zap className="w-4 h-4 fill-current" /> : <ZapOff className="w-4 h-4" />}
          Torch {isTorchOn ? 'On' : 'Off'}
        </button>
      </div>
    </div>
  );
}
