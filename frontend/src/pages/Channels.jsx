import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { channelsAPI } from '../services/api';

export default function Channels() {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [channelName, setChannelName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    try {
      const response = await channelsAPI.list();
      setChannels(response.data.channels);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch channels:', error);
      setLoading(false);
    }
  };

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await channelsAPI.create({ 
        name: channelName, 
        description 
      });
      setChannels([...channels, response.data]);
      setShowCreate(false);
      setChannelName('');
      setDescription('');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create channel');
    }
  };

  const handleJoinChannel = (channel) => {
    navigate(`/chat/${channel._id}`);
  };

  if (loading) {
    return (
      <div className="channels-container">
        <div className="loading">Loading channels...</div>
      </div>
    );
  }

  return (

    <div className="min-h-screen bg-gradient-to-br from-indigo-400 to-purple-600 p-8">
  <div className="max-w-6xl mx-auto flex justify-between items-center mb-8 bg-white p-6 rounded-xl shadow-md">
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-2">Team Chat</h1>
      <p className="text-gray-600">Welcome, {user?.name}!</p>
    </div>
    <button onClick={logout} className="bg-red-500 text-white px-6 py-3 rounded-md font-medium hover:bg-red-600 transition">
      Logout
    </button>
  </div>

  <div className="max-w-6xl mx-auto grid grid-cols-[300px_1fr] gap-8">
    <div className="bg-white p-6 rounded-xl shadow-md h-fit">
      <button
        onClick={() => setShowCreate(!showCreate)}
        className="w-full bg-indigo-500 text-white py-4 rounded-md font-semibold hover:bg-indigo-600 transition mb-4"
      >
        {showCreate ? 'Cancel' : '+ Create Channel'}
      </button>

      {showCreate && (
        <form onSubmit={handleCreateChannel} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Channel name"
            value={channelName}
            onChange={(e) => setChannelName(e.target.value)}
            required
            className="p-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-indigo-500"
          />
          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="3"
            className="p-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-indigo-500"
          />
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">{error}</div>}
          <button type="submit" className="bg-emerald-500 text-white py-3 rounded-md font-semibold hover:bg-emerald-600 transition">
            Create
          </button>
        </form>
      )}
    </div>

    <div className="bg-white p-8 rounded-xl shadow-md">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Channels</h2>
      {channels.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          <p>No channels yet. Create one to get started!</p>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(250px,1fr))]">
          {channels.map((channel) => (
            <div
              key={channel._id}
              className="bg-gray-50 p-6 rounded-lg cursor-pointer border-2 border-transparent transition hover:border-indigo-500 hover:-translate-y-0.5 hover:shadow-lg"
              onClick={() => handleJoinChannel(channel)}
            >
              <h3 className="text-gray-800 font-medium mb-2">{channel.name}</h3>
              {channel.description && (
                <p className="text-gray-600 text-sm my-2">{channel.description}</p>
              )}
              <div className="flex justify-between items-center mt-4 text-xs text-gray-500">
                <span>{channel.members?.length || 0} members</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
</div>

  );
}


