import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff } from 'lucide-react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

const NetworkStatusIndicator = () => {
  const { isOnline } = useNetworkStatus();
  const [showConnected, setShowConnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (isOnline) {
      if (wasOffline) {
        setShowConnected(true);
        const timer = setTimeout(() => {
          setShowConnected(false);
          setWasOffline(false);
        }, 3000);
        return () => clearTimeout(timer);
      }
    } else {
      setWasOffline(true);
    }
  }, [isOnline, wasOffline]);

  return (
    <AnimatePresence>
      {(!isOnline || showConnected) && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={`fixed top-0 left-0 right-0 z-[100] flex items-center justify-center py-1.5 px-4 shadow-lg backdrop-blur-md ${
            !isOnline ? 'bg-blue-600/90' : 'bg-green-600/90'
          }`}
        >
          <div className="flex items-center gap-2 text-white">
            {!isOnline ? (
              <>
                <WifiOff size={14} className="animate-pulse" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Modo Offline Ativo</span>
              </>
            ) : (
              <>
                <Wifi size={14} />
                <span className="text-[11px] font-bold uppercase tracking-wider">Conexão Restabelecida</span>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NetworkStatusIndicator;
