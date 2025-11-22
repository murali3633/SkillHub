import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './GeminiChat.css';

const GeminiChat = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const messagesEndRef = useRef(null);
  const sendingRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Test API connection on first load
  useEffect(() => {
    const testConnection = async () => {
      const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
      if (!API_KEY) {
        console.warn('Gemini API key not found in environment variables');
      } else {
        console.log('Gemini API key loaded successfully');
        console.log('API Key (first 10 chars):', API_KEY.substring(0, 10) + '...');
      }
    };
    testConnection();
  }, []);

  // Handle mobile keyboard visibility
  useEffect(() => {
    const handleResize = () => {
      // Force scroll to bottom when keyboard appears/disappears on mobile
      if (window.innerHeight < 500) {
        setTimeout(() => scrollToBottom(), 100);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Only show for students - check this AFTER declaring ALL hooks
  if (!user || user.role !== 'student') {
    return null;
  }

  const sendMessage = async (retryCount = 0) => {
    if (!inputMessage.trim() || isLoading || sendingRef.current) return;
    
    // Set sending flag to prevent duplicate calls
    sendingRef.current = true;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    try {
      const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
      
      console.log('API Key exists:', !!API_KEY);
      console.log('API Key length:', API_KEY ? API_KEY.length : 'undefined');
      console.log('API Key first 10 chars:', API_KEY ? API_KEY.substring(0, 10) + '...' : 'undefined');
      console.log('All env vars:', Object.keys(process.env).filter(key => key.startsWith('REACT_APP_')));
      console.log('Making request to Gemini API...');
      
      if (!API_KEY) {
        throw new Error('API_KEY_MISSING');
      }

      const systemPrompt = `You are SkillBot, SkillHub's AI learning assistant. Give SHORT, CLEAR responses.

RESPONSE RULES:
- Keep answers under 3-4 sentences OR use bullet points
- Be direct and specific
- Use simple language
- No long explanations unless asked
- Use emojis sparingly (1-2 max)

SKILLHUB INFO:
- 1,200+ courses in Programming, Data Science, Design, Marketing, Business
- Expert instructors, certificates, hands-on projects
- Students can browse, enroll, learn, get certified

YOUR ROLE:
Help with:
• Course content & concepts
• Study tips & strategies  
• Assignment guidance
• Platform navigation
• Course recommendations

RESPONSE FORMAT:
For questions: Give direct answers in 2-3 sentences
For lists: Use bullet points (max 5 items)
For explanations: Keep under 50 words
For recommendations: List 2-3 specific options

Always be helpful but CONCISE. Students want quick, clear answers.`;
      
      // Build conversation context with recent history (last 6 messages for context)
      const recentHistory = conversationHistory.slice(-6);
      const contextMessages = recentHistory.length > 0 
        ? `\n\nRecent conversation context:\n${recentHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}\n`
        : '';
      
      // Add user context for personalized responses
      const userContext = user ? `\n\nCurrent student: ${user.name} (${user.email})` : '';
      
      const requestBody = {
        contents: [{
          parts: [{
            text: `${systemPrompt}${userContext}${contextMessages}\n\nStudent question: ${currentMessage}`
          }]
        }]
      };

      // Use the correct model name for v1beta API
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`;
      console.log('Making request to:', url.split('?')[0]);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`HTTP_${response.status}`);
      }

      console.log('Final response status:', response.status);

      const data = await response.json();
      console.log('API Response:', data);
      
      if (data.candidates && data.candidates.length > 0 && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts.length > 0) {
        const botResponseText = data.candidates[0].content.parts[0].text;
        const botMessage = {
          id: Date.now() + 1,
          text: botResponseText,
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString()
        };
        setMessages(prev => [...prev, botMessage]);
        
        // Update conversation history for context
        setConversationHistory(prev => [
          ...prev,
          { role: 'Student', content: currentMessage },
          { role: 'SkillBot', content: botResponseText }
        ]);
      } else {
        console.error('Unexpected response structure:', data);
        throw new Error('INVALID_RESPONSE_FORMAT');
      }
    } catch (error) {
      console.error('Detailed error:', error);
      let errorText = 'Sorry, I encountered an error. Please try again later.';
      
      if (error.message === 'API_KEY_MISSING') {
        errorText = '🔑 API key not configured. Please contact support.';
      } else if (error.message === 'HTTP_400') {
        errorText = '❌ Invalid request format. Please try a different question.';
      } else if (error.message === 'HTTP_403') {
        errorText = '🚫 API access denied. Please check API key permissions.';
      } else if (error.message === 'HTTP_429') {
        errorText = '⏱️ Too many requests. Please wait a moment and try again.';
      } else if (error.message === 'HTTP_404') {
        errorText = '🔍 API endpoint not found. Please contact support.';
      } else if (error.message === 'HTTP_503') {
        if (retryCount < 2) {
          // Retry after a delay for 503 errors (up to 2 retries)
          setTimeout(() => {
            setInputMessage(currentMessage);
            sendMessage(retryCount + 1);
          }, (retryCount + 1) * 2000); // 2s, 4s delay
          setIsLoading(false);
          return;
        }
        errorText = '🔄 The AI service is currently overloaded. Please wait a few moments and try again.';
      } else if (error.message === 'INVALID_RESPONSE_FORMAT') {
        errorText = '📋 Received unexpected response format. Please try again.';
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorText = '🌐 Network error. Please check your internet connection.';
      }
      
      const errorMessage = {
        id: Date.now() + 1,
        text: errorText,
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      sendingRef.current = false;
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setConversationHistory([]);
  };

  // Function to parse markdown formatting
  const parseMarkdown = (text) => {
    if (!text) return text;
    
    // Replace **bold** with <strong>
    let parsed = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Replace *italic* with <em>
    parsed = parsed.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Replace `code` with <code>
    parsed = parsed.replace(/`(.*?)`/g, '<code>$1</code>');
    
    return parsed;
  };

  return (
    <div className="gemini-chat-container">
      {/* Chat Toggle Button */}
      <button 
        className={`chat-toggle-btn ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle AI Assistant"
      >
        {isOpen ? '✕' : '🤖'}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <div className="chat-title">
              <span className="chat-icon">🤖</span>
              <span>SkillBot - AI Assistant</span>
            </div>
            <div className="chat-actions">
              <button 
                className="clear-btn" 
                onClick={clearChat}
                title="Clear chat"
              >
                🗑️
              </button>
              <button 
                className="close-btn" 
                onClick={() => setIsOpen(false)}
                title="Close chat"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="chat-messages">
            {messages.length === 0 && (
              <div className="welcome-message">
                <div className="bot-message">
                  <div className="message-content">
                    <p>Hi {user?.name ? user.name.split(' ')[0] : 'Murali'}! I'm <strong>SkillBot</strong>, your AI learning assistant on SkillHub.</p>
                    <p>I can help you with:</p>
                    <ul>
                      <li>📚 Course content & concepts</li>
                      <li>📝 Assignments & problem-solving</li>
                      <li>🎯 Career guidance</li>
                      <li>💡 Study tips & skill growth</li>
                      <li>🧭 Platform support</li>
                    </ul>
                    <p>Let's make learning faster and easier! 🚀</p>
                  </div>
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div key={message.id} className={`message ${message.sender} ${message.isError ? 'error' : ''}`}>
                <div className="message-content">
                  {message.isError && <span className="error-icon">⚠️</span>}
                  <p dangerouslySetInnerHTML={{ __html: parseMarkdown(message.text) }}></p>
                  <span className="message-time">{message.timestamp}</span>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="message bot">
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-container">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask SkillBot anything about your courses, assignments, or studies..."
              className="chat-input"
              rows="2"
              disabled={isLoading}
            />
            <button 
              onClick={() => {
                if (!sendingRef.current && !isLoading && inputMessage.trim()) {
                  sendMessage();
                }
              }}
              className="send-btn"
              disabled={!inputMessage.trim() || isLoading || sendingRef.current}
            >
              {isLoading ? '⏳' : '📤'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeminiChat;
