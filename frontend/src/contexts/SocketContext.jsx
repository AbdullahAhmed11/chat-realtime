import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [activity, setActivity] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:4000', {
      auth: { token },
    });

    newSocket.on('connect', () => {
      console.log('Connected to server');
      setConnected(true);
    });

    newSocket.on('connected', (data) => {
      console.log('Socket connected:', data);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnected(false);
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    setSocket(newSocket);
    socketRef.current = newSocket;

    return () => {
      newSocket.close();
    };
  }, [user]);

  const joinChannel = (channelId) => {
    if (!socket) return;
    socket.emit('joinChannel', { channelId });
  };

  const leaveChannel = (channelId) => {
    if (!socket) return;
    socket.emit('leaveChannel', { channelId });
  };

  const sendMessage = (channelId, content, type = 'text') => {
    if (!socket) return;
    socket.emit('sendMessage', { channelId, content, type });
  };

  return (
    <SocketContext.Provider value={{ 
      socket, 
      connected, 
      joinChannel, 
      leaveChannel, 
      sendMessage
    }}>
      {children}
    </SocketContext.Provider>
  );
};

