import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from "html5-qrcode";
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
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    let isMounted = true;
    let scanner: Html5QrcodeScanner | null = null;

    const initScanner = async () => {
      // Small delay to ensure the DOM element is actually rendered
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!isMounted || !isOpen || !document.getElementById("qr-reader")) return;

      try {
        scanner = new Html5QrcodeScanner(
          "qr-reader",
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
            aspectRatio: 1.0
          },
          /* verbose= */ false
        );

        scanner.render(
          (decodedText) => {
            onScan(decodedText);
            if (scanner) {
              scanner.clear().catch(err => console.error("Failed to clear scanner", err));
            }
          },
          (errorMessage) => {
            // We don't want to show every scan error (like "No QR code found")
          }
        );

        scannerRef.current = scanner;
      } catch (err: any) {
        console.error("Scanner init error:", err);
        setError("Could not start camera. Please check permissions.");
      }
    };

    if (isOpen) {
      initScanner();
    }

    return () => {
      isMounted = false;
      if (scanner) {
        scanner.clear().catch(err => console.error("Cleanup error:", err));
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
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4"
        >
          <div className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                   <Camera className="text-primary h-5 w-5" /> 
                   Profile Scanner
                </h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">Scan an EdWorld ID Card</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose}
                className="rounded-full hover:bg-slate-100"
              >
                <X className="h-5 w-5 text-slate-500" />
              </Button>
            </div>

            <div className="p-4 bg-slate-50">
              <div 
                id="qr-reader" 
                className="overflow-hidden rounded-2xl border-4 border-white shadow-inner bg-slate-200 aspect-square"
              />
              
              {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100 text-center uppercase tracking-wider">
                  {error}
                </div>
              )}
            </div>

            <div className="p-6 bg-white">
              <div className="flex items-center gap-3 text-slate-500 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <RefreshCcw className="h-5 w-5 text-primary animate-spin-slow" />
                </div>
                <p className="text-sm font-medium leading-tight">
                  Point your camera at another student's ID card QR code to instantly connect.
                </p>
              </div>
              
              <Button 
                onClick={onClose}
                className="w-full mt-6 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl h-14 uppercase tracking-widest shadow-xl"
              >
                Cancel Scanning
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
