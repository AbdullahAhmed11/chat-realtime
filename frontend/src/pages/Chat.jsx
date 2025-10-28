import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { messagesAPI, channelsAPI } from '../services/api';

export default function Chat() {
  const { id } = useParams();
  const { user } = useAuth();
  const { socket, joinChannel, leaveChannel, sendMessage } = useSocket();
  const navigate = useNavigate();
  
  const [channel, setChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState('');
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    fetchChannelData();
    return () => {
      if (socket) {
        leaveChannel(id);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (socket && channel) {
      joinChannel(id);
      
      const handleJoin = (data) => {
        setActivity(`${data.user.name} joined the channel`);
        setTimeout(() => setActivity(''), 3000);
      };
      
      const handleLeave = (data) => {
        setActivity(`${data.user.name} left the channel`);
        setTimeout(() => setActivity(''), 3000);
      };
      
      const handleNewMessage = (data) => {
        setMessages((prev) => [...prev, data.message]);
        scrollToBottom();
      };

      socket.on('user_joined', handleJoin);
      socket.on('user_left', handleLeave);
      socket.on('newMessage', handleNewMessage);

      return () => {
        socket.off('user_joined', handleJoin);
        socket.off('user_left', handleLeave);
        socket.off('newMessage', handleNewMessage);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, channel, id]);

  const fetchChannelData = async () => {
    try {
      const [channelData, messagesData] = await Promise.all([
        channelsAPI.get(id),
        messagesAPI.list(id)
      ]);
      setChannel(channelData.data);
      setMessages(messagesData.data.messages || []);
      console.log(messagesData.data.messages,"All chats")
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch channel data:', error);
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    sendMessage(id, newMessage.trim());
    setNewMessage('');
    scrollToBottom();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (loading) {
    return (
      <div className="chat-container">
        <div className="loading">Loading channel...</div>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="chat-container">
        <div className="error-state">Channel not found</div>
      </div>
    );
  }

  return (

<div className="flex flex-col h-screen bg-gray-100">
  <div className="bg-gradient-to-tr from-indigo-500 to-purple-600 px-8 py-6 flex items-center gap-6 shadow-md">
    <button
      onClick={() => navigate('/channels')}
      className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-md font-medium transition"
    >
      ← Back
    </button>
    <div>
      <h1 className="text-white text-2xl font-semibold">{channel.name}</h1>
      {channel.description && (
        <p className="text-white/90 text-sm mt-1">{channel.description}</p>
      )}
    </div>
  </div>

  {activity && (
    <div className="bg-green-500 text-white text-center py-3 text-sm animate-slideDown">
      {activity}
    </div>
  )}

  <div className="flex-1 overflow-y-auto p-6 bg-white">
    {messages.length === 0 ? (
      <div className="flex items-center justify-center h-full text-gray-600">
        <p>No messages yet. Start the conversation!</p>
      </div>
    ) : (
      <div className="flex flex-col gap-4 max-w-[1000px] mx-auto">
        {messages.map((message, index) => (
          <div
            key={message.id || index}
            className={`p-4 rounded-lg max-w-[70%] ${
              message.sender?._id === user?.id || message.sender === user?.id
                ? 'bg-indigo-500 text-white self-end'
                : 'bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <span
                className={`font-semibold text-sm ${
                  message.sender?._id === user?.id || message.sender === user?.id
                    ? 'text-white'
                    : 'text-gray-800'
                }`}
              >
                {message.sender.name}
              </span>
              <span className="text-xs opacity-70">
                {new Date(message.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <div className="break-words leading-relaxed">{message.content}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    )}
  </div>

  <form
    onSubmit={handleSendMessage}
    className="bg-white px-8 py-6 flex gap-4 border-t border-gray-200"
  >
    <input
      type="text"
      value={newMessage}
      onChange={(e) => setNewMessage(e.target.value)}
      placeholder="Type a message..."
      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-full text-base outline-none focus:border-indigo-500"
    />
    <button
      type="submit"
      className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2.5 rounded-full font-semibold transition"
    >
      Send
    </button>
  </form>
</div>

  );
}

