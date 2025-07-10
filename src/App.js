import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, Loader2 } from 'lucide-react';

const PattrntStudiosChatbot = () => {
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      text: "Hello there. We're Pattrn Studios", 
      sender: 'bot', 
      timestamp: new Date(),
      isVisible: false
    },
    { 
      id: 2, 
      text: "We are an independent design studio making digital experiences that deliver lasting value", 
      sender: 'bot', 
      timestamp: new Date(),
      isVisible: false
    },
    { 
      id: 3, 
      text: "How can we help you today? Please don't hesitate to ask us anything about our company, our services, or your specific inquiry", 
      sender: 'bot', 
      timestamp: new Date(),
      isVisible: false
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [typingQueue, setTypingQueue] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Helper function to clean JSON responses
  const cleanJsonResponse = (response) => {
    let cleaned = response.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    }
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    return cleaned;
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Show initial messages with delay
  useEffect(() => {
    const showInitialMessages = () => {
      setTimeout(() => {
        setMessages(prev => prev.map(msg => 
          msg.id === 1 ? { ...msg, isVisible: true } : msg
        ));
      }, 800);

      setTimeout(() => {
        setMessages(prev => prev.map(msg => 
          msg.id === 2 ? { ...msg, isVisible: true } : msg
        ));
      }, 2200);

      setTimeout(() => {
        setMessages(prev => prev.map(msg => 
          msg.id === 3 ? { ...msg, isVisible: true } : msg
        ));
      }, 3800);
    };

    showInitialMessages();
  }, []);

  // Process typing queue
  useEffect(() => {
    if (typingQueue.length > 0 && !isTyping) {
      setIsTyping(true);
      const nextMessage = typingQueue[0];
      
      setTimeout(() => {
        const newMessage = {
          id: Date.now() + Math.random(),
          text: nextMessage.text,
          sender: 'bot',
          timestamp: new Date(),
          isVisible: true
        };
        
        setMessages(prev => [...prev, newMessage]);
        setTypingQueue(prev => prev.slice(1));
        setIsTyping(false);
      }, nextMessage.delay);
    }
  }, [typingQueue, isTyping]);

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
      isVisible: true
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Prepare conversation history including all visible messages
      const visibleMessages = [...messages.filter(msg => msg.isVisible), userMessage];
      const conversationHistory = visibleMessages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      }));

      const prompt = `
      Previous conversation history:
      ${JSON.stringify(conversationHistory)}

      Current user message: "${inputText}"
      `;

      const response = await fetch('/.netlify/functions/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const cleanedResponse = cleanJsonResponse(data.response);
      const jsonResponse = JSON.parse(cleanedResponse);

      // Add messages to typing queue
      setTypingQueue(jsonResponse.messages || []);

    } catch (error) {
      console.error('Error in Claude completion:', error);
      const errorMessage = {
        text: "I apologise, but I encountered an error. Please try again.",
        delay: 1000
      };
      setTypingQueue([errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans" style={{ backgroundColor: '#FEFEF5' }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Pattrn Studios</h1>
            <p className="text-sm text-gray-600">Partners in Design and Innovation</p>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} ${
              message.isVisible ? 'animate-fade-in' : 'opacity-0'
            }`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                message.sender === 'user'
                  ? 'bg-black text-white rounded-br-md'
                  : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
              }`}
            >
              <p className="text-sm leading-relaxed">{message.text}</p>
              <p className={`text-xs mt-2 ${
                message.sender === 'user' ? 'text-gray-300' : 'text-gray-500'
              }`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        
        {(isTyping || isLoading) && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-white text-gray-800 border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-xs text-gray-500">typing...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 px-4 py-4">
        <div className="flex space-x-3 items-end">
          <div className="flex-1">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="w-full resize-none border border-gray-300 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm leading-relaxed"
              rows="1"
              disabled={isLoading || isTyping}
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!inputText.trim() || isLoading || isTyping}
            className="bg-black text-white rounded-full p-3 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex-shrink-0"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2 px-1">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default PattrntStudiosChatbot;
