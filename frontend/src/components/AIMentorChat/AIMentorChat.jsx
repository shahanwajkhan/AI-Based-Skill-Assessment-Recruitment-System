import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './AIMentorChat.css';
import { API_URL } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const AIMentorChat = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: `Hello ${user?.first_name || user?.username || 'there'}, I'm your AI Mentor. How can I help you today?`, sender: 'ai' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (text) => {
    const msg = text || inputValue;
    if (!msg.trim()) return;

    // Add user message
    const userMsg = { id: Date.now(), text: msg, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/ai-mentor/chat/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: msg })
      });

      if (response.ok) {
        const data = await response.json();
        const aiMsg = { id: Date.now() + 1, text: data.response, sender: 'ai' };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        throw new Error("Failed to get response");
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        text: "I'm having a bit of trouble thinking right now. Could you try again in a moment?", 
        sender: 'ai' 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestion = (text) => {
    handleSendMessage(text);
  };

  return (
    <div className="ai-mentor-wrapper">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="ai-mentor-panel"
            initial={{ opacity: 0, scale: 0.8, y: 50, x: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50, x: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <div className="mentor-header">
              <div className="mentor-title">
                <div className="mentor-avatar-icon">🤖</div>
                <div className="mentor-info">
                  <span className="mentor-name">AI Mentor</span>
                  <div className="mentor-presence">
                    <span className="presence-dot"></span>
                    Online & Ready
                  </div>
                </div>
              </div>
              <button className="close-chat-btn" onClick={() => setIsOpen(false)}>✕</button>
            </div>

            <div className="mentor-messages">
              {messages.map((msg) => (
                <div key={msg.id} className={`message ${msg.sender}`}>
                  {msg.text}
                </div>
              ))}
              {isTyping && <div className="typing">AI Mentor is thinking...</div>}
              <div ref={messagesEndRef} />
            </div>

            <div className="quick-suggestions">
              <button className="suggestion-btn" onClick={() => handleSuggestion("What should I learn next?")}>
                🎯 Next Topic?
              </button>
              <button className="suggestion-btn" onClick={() => handleSuggestion("Help me improve my weak areas")}>
                💡 Weak Areas
              </button>
              <button className="suggestion-btn" onClick={() => handleSuggestion("Suggest coding practice")}>
                💻 Code Practice
              </button>
            </div>

            <form className="mentor-input-area" onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}>
              <input 
                type="text" 
                placeholder="Ask me anything..." 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
              <button type="submit" className="send-msg-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {!isOpen && (
        <div className="ai-trigger-container">
          <motion.div 
            className="ai-mentor-tooltip"
            initial={{ opacity: 0, x: 10 }}
            whileHover={{ opacity: 1, x: 0 }}
          >
            Ask AI Mentor
          </motion.div>
          <motion.button 
            className="ai-mentor-trigger"
            onClick={() => setIsOpen(true)}
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="pulse-ring"></div>
            <div className="pulse-ring"></div>
            <div className="pulse-ring"></div>
            <div className="trigger-icon-wrap">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-11.7 8.38 8.38 0 0 1 3.8.9L21 3l-1.9 4.9y"/>
                <circle cx="9" cy="11" r="1" fill="white"></circle>
                <circle cx="15" cy="11" r="1" fill="white"></circle>
                <path d="M9 15c.5 1 1.5 2 3 2s2.5-1 3-2" strokeWidth="2"></path>
              </svg>
            </div>
          </motion.button>
        </div>
      )}
    </div>
  );
};

export default AIMentorChat;
