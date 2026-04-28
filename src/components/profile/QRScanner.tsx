import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { X, Camera, RefreshCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export function QRScanner({ onScan, onClose, isOpen }: QRScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const qrCodeInstanceRef = useRef<Html5Qrcode | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      if (qrCodeInstanceRef.current && qrCodeInstanceRef.current.isScanning) {
        qrCodeInstanceRef.current.stop()
          .then(() => qrCodeInstanceRef.current?.clear())
          .catch(err => console.error("Failed to stop scanner", err));
      }
      return;
    }

    const startScanner = async () => {
      setIsInitializing(true);
      setError(null);
      
      try {
        // Small delay to ensure the DOM element is actually rendered
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const element = document.getElementById("qr-reader");
        if (!element) return;

        const html5QrCode = new Html5Qrcode("qr-reader");
        qrCodeInstanceRef.current = html5QrCode;

        const config = { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          aspectRatio: 1.0
        };

        await html5QrCode.start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            onScan(decodedText);
            // After a successful scan, we usually close or stop
            html5QrCode.stop().catch(console.error);
          },
          (errorMessage) => {
            // Ignore common scan errors
          }
        );
      } catch (err: any) {
        console.error("Scanner init error:", err);
        setError("Could not access camera. Please check permissions and ensure no other app is using it.");
      } finally {
        setIsInitializing(false);
      }
    };

    startScanner();

    return () => {
      if (qrCodeInstanceRef.current && qrCodeInstanceRef.current.isScanning) {
        qrCodeInstanceRef.current.stop().catch(err => console.error("Cleanup stop error:", err));
      }
    };
  }, [isOpen, onScan]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/95 backdrop-blur-xl p-4 sm:p-6"
        >
          <div className="relative w-full max-w-sm bg-white rounded-[2.5rem] overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                   <Camera className="text-primary h-5 w-5" /> 
                   ID Scanner
                </h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Scan an EdWorld Profile</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose}
                className="rounded-full hover:bg-slate-100 h-10 w-10"
              >
                <X className="h-5 w-5 text-slate-500" />
              </Button>
            </div>

            <div className="p-6 bg-slate-50 flex flex-col items-center justify-center min-h-[320px]">
              <div 
                id="qr-reader" 
                className="w-full aspect-square overflow-hidden rounded-[2rem] border-4 border-white shadow-xl bg-slate-200 relative"
              >
                {isInitializing && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-100 z-10">
                    <RefreshCcw className="h-8 w-8 text-primary animate-spin" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Waking up camera...</p>
                  </div>
                )}
              </div>
              
              {error && (
                <div className="mt-6 p-4 bg-red-50 text-red-600 text-[10px] font-bold rounded-2xl border border-red-100 text-center uppercase tracking-widest leading-relaxed">
                  {error}
                </div>
              )}
            </div>

            <div className="p-6 bg-white space-y-4">
              <div className="flex items-center gap-4 text-slate-500 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <RefreshCcw className="h-5 w-5 text-primary animate-spin-slow" />
                </div>
                <p className="text-xs font-bold leading-relaxed uppercase tracking-tight">
                  Point camera at the QR code on a student's ID card.
                </p>
              </div>
              
              <Button 
                onClick={onClose}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl h-14 uppercase tracking-widest shadow-xl shadow-slate-200 transition-all active:scale-95"
              >
                Close Scanner
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
