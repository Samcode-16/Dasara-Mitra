import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, RefreshCw } from 'lucide-react';
import { Button, Input } from './ui.jsx';
import { useLanguage } from './DasaraContext';
import { askFestivalAssistant } from './assistantClient.js';

const getAssistantGreeting = (lang) => {
  if (lang === 'kn') {
    return 'ನಮಸ್ಕಾರ! ಮೈಸೂರು ದಸರಾ ಬಗ್ಗೆ ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?';
  }
  if (lang === 'hi') {
    return 'नमस्कार! मैसूरु दशहरा में मैं आपकी कैसे सहायता कर सकता हूँ?';
  }
  return 'Namaskara! How can I help you with Mysore Dasara today?';
};

const containsHindiScript = (text = '') => /[\u0900-\u097F]/.test(text);

export default function Chatbot() {
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: getAssistantGreeting(language) }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  useEffect(() => {
    setMessages((previous) => {
      if (previous.length === 1 && previous[0].role === 'assistant') {
        return [{ role: 'assistant', content: getAssistantGreeting(language) }];
      }
      return previous;
    });
  }, [language]);

  const handleSend = async (e) => {
    // Inside your handleSend or sendMessage function:

try {
  const response = await fetch('/api/chat', {  // <--- This points to the Vercel function we just made
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      message: userMessage,
      history: [] // You can pass chat history here if you want context
    }),
  });

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error);
  }

  // Add the bot's reply to your state
  setMessages(prev => [...prev, { role: 'bot', text: data.reply }]);

} catch (error) {
  console.error("Chat Error:", error);
  setMessages(prev => [...prev, { role: 'bot', text: "Sorry, I'm having trouble connecting to the Dasara servers right now." }]);
}
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    const responseLanguage = containsHindiScript(userMsg) ? 'hi' : language;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      // Construct a prompt that includes context
      const reply = await askFestivalAssistant({
        userMessage: userMsg,
        languageCode: responseLanguage,
        history: messages
      });

      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (error) {
      console.error("Chat error:", error);
      const problem = error?.message || '';

      if (problem === 'missing-api-key' || problem === 'missing-server-key') {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Chat configuration is missing. Please add your Gemini key to the backend proxy.' }]);
      } else if (problem === 'assistant-offline') {
        setMessages(prev => [...prev, { role: 'assistant', content: 'The Dasara helper service is offline. Start the backend proxy and try again.' }]);
      } else if (problem === 'empty-response') {
        setMessages(prev => [...prev, { role: 'assistant', content: 'I could not find festival details right now. Try asking again in a moment.' }]);
      } else if (problem.startsWith('blocked:')) {
        const reason = problem.split(':')[1] || 'safety';
        setMessages(prev => [...prev, { role: 'assistant', content: `I could not answer that request due to safety filters (${reason}). Please try asking in another way.` }]);
      } else {
        const friendlyMessage = problem
          ? `${t('error')} (${problem})`
          : t('error');
        setMessages(prev => [...prev, { role: 'assistant', content: friendlyMessage }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const closeChat = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-xl text-white flex items-center gap-2 transition-all hover:scale-110 transform duration-200 ${isOpen ? 'hidden' : 'flex'}`}
        style={{ backgroundColor: '#DAA520' }}
      >
        <MessageCircle className="w-6 h-6" />
        <span className="font-bold hidden md:inline">{t('chatTitle')}</span>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          className="fixed bottom-6 right-6 z-50 w-[90vw] md:w-[400px] h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-[#DAA520] animate-in fade-in slide-in-from-bottom-4 duration-300"
        >
          {/* Header */}
          <div className="p-4 bg-[#800000] text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <h3 className="font-bold">{t('chatTitle')}</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={closeChat}
              className="text-white hover:bg-white/20"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user'
                      ? 'bg-gray-200 text-gray-800 rounded-br-none'
                      : 'bg-[#800000] text-white rounded-bl-none'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-[#800000] text-white p-3 rounded-2xl rounded-bl-none flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span className="text-xs">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-4 bg-white border-t">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('chatPlaceholder')}
                className="focus-visible:ring-[#DAA520]"
              />
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-[#DAA520] hover:bg-[#B8860B] text-white"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}