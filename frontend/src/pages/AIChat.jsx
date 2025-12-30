import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useTranslation } from 'react-i18next'; // <--- IMPORT

function AIChat() {
  const { t } = useTranslation(); // <--- ACTIVATION
  const [messages, setMessages] = useState([
    { id: 1, text: t('initial_msg'), sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [isModifyMode, setIsModifyMode] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { id: Date.now(), text: input, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      if (isModifyMode) {
        // --- MODE MODIFICATION ---
        const res = await api.post('/ai/modify', { instruction: userMsg.text });
        
        if (res.data.success) {
            setMessages(prev => [...prev, { 
                id: Date.now() + 1, 
                text: t('modify_success', { msg: res.data.message }), // Utilisation de paramètre
                sender: 'bot' 
            }]);
            setIsModifyMode(false);
        } else {
             setMessages(prev => [...prev, { id: Date.now() + 1, text: t('modify_error'), sender: 'bot' }]);
        }

      } else {
        // --- MODE CHAT NORMAL ---
        const res = await api.post('/ai/chat', { 
            message: userMsg.text,
            history: messages.slice(-5)
        });
        setMessages(prev => [...prev, { id: Date.now() + 1, text: res.data.reply, sender: 'bot' }]);
      }

    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now() + 1, text: t('connection_error'), sender: 'bot' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 pb-20">
      
      {/* HEADER */}
      <div className="bg-white p-4 shadow-sm flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
            <Link to="/" className="text-2xl">←</Link>
            <div>
                <h1 className="font-bold text-lg">{t('ai_coach_title')}</h1>
                <p className="text-xs text-green-500 font-bold">{t('online_status')}</p>
            </div>
        </div>
      </div>

      {/* ZONE DE MESSAGES */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${
              msg.sender === 'user' 
                ? 'bg-black text-white rounded-tr-none' 
                : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-none'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
            <div className="flex justify-start">
                <div className="bg-gray-200 text-gray-500 text-xs px-4 py-2 rounded-full animate-pulse">
                    {isModifyMode ? t('modifying') : t('writing')}
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* BARRE D'ENTRÉE */}
      <div className="p-4 bg-white border-t border-gray-100">
        
        {/* Indication du mode */}
        {isModifyMode && (
            <div className="bg-blue-50 text-blue-700 text-xs p-2 rounded-lg mb-2 flex justify-between items-center animate-fade-in">
                <span>{t('modify_mode_on')}</span>
                <button onClick={() => setIsModifyMode(false)} className="font-bold text-lg">×</button>
            </div>
        )}

        <form onSubmit={handleSend} className="flex gap-2">
          {/* BOUTON TOGGLE MODIFICATION */}
          <button 
            type="button"
            onClick={() => setIsModifyMode(!isModifyMode)}
            className={`p-3 rounded-xl transition ${isModifyMode ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            title="Modifier mon programme"
          >
            🛠️
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className={`flex-1 border-2 rounded-xl px-4 focus:outline-none transition ${isModifyMode ? 'border-blue-600' : 'border-gray-200 focus:border-black'}`}
            placeholder={isModifyMode ? t('modify_placeholder') : t('type_placeholder')}
          />
          
          <button 
            type="submit" 
            disabled={loading || !input.trim()}
            className={`text-white p-3 rounded-xl font-bold transition disabled:opacity-50 ${isModifyMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-black hover:bg-gray-800'}`}
          >
            ➤
          </button>
        </form>
      </div>

    </div>
  );
}

export default AIChat;