import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/logo.png";

export function LoadingBar() {
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 400); // Progress bar duration

    return () => clearTimeout(timer);
  }, [location]);

  return (
    <AnimatePresence>
      {loading && (
        <div className="fixed top-0 left-0 right-0 z-[100] h-1.5 bg-slate-100 overflow-hidden">
          <motion.div
            initial={{ width: "0%", x: "-100%" }}
            animate={{ width: "100%", x: "0%" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "circOut" }}
            className="h-full bg-gradient-to-r from-primary via-indigo-500 to-primary relative"
          >
            {/* Shimmer effect */}
            <motion.div 
               animate={{ x: ['-100%', '200%'] }}
               transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
               className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            />
            
            {/* Floating Logo Indicator */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 transform translate-x-1/2">
               <motion.div
                animate={{ 
                  scale: [1, 1.15, 1],
                  rotate: [0, 5, -5, 0],
                  boxShadow: ["0 0 0 0 rgba(14, 165, 233, 0)", "0 0 0 10px rgba(14, 165, 233, 0.1)", "0 0 0 0 rgba(14, 165, 233, 0)"]
                }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="bg-white p-1.5 rounded-xl shadow-2xl border border-secondary"
               >
                 <img src={logo} alt="" className="h-7 w-auto object-contain" />
               </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
