import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

function getSocketUrl() {
  const configuredSocketUrl = (import.meta.env.VITE_SOCKET_URL || '').trim().replace(/\/$/, '');
  if (configuredSocketUrl) return configuredSocketUrl;

  const configuredApiUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');
  if (configuredApiUrl) return configuredApiUrl;

  // Development: Vite mem-proxy /api dan /socket.io ke backend localhost.
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:5000';
  }

  // Deployment satu domain / reverse proxy.
  return window.location.origin;
}

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const s = io(getSocketUrl(), {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    s.on('connect', () => {
      console.log('[Socket] Terhubung dengan id:', s.id);
      setConnected(true);
    });

    s.on('disconnect', () => {
      console.log('[Socket] Terputus');
      setConnected(false);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
