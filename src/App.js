import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, Loader2 } from 'lucide-react';

const PattrnStudiosChatbot = () => {
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      text: "Hello there. We're Pattrrn Studios", 
      sender: 'bot', 
      timestamp: new Date(),
      isVisible: false
    },
    { 
      id: 2, 
      text: "We help fintech and wealth tech companies build better customer experiences", 
      sender: 'bot', 
      timestamp: new Date(),
      isVisible: false
    },
    { 
      id: 3, 
      text: "What brings you here today", 
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
      }, 1800);

      setTimeout(() => {
        setMessages(prev => prev.map(msg => 
          msg.id === 3 ? { ...msg, isVisible: true } : msg
        ));
      }, 2500);
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
      You are a chatbot for Pattrrn Studios, a user experience design studio that specializes in solving service-related problems.

      Brand Information:
      - Company: Pattrrn Studios (note: "Pattrrn" not "Pattern")
      - Mission: Making digital experiences that deliver lasting value
      - Focus: We mostly work with people in asset management, wealth technology, and fintech
      - Core Philosophy: "Start with people and their problems" - technology can't solve problems by itself
      - Services: Digital Product Design, Product Management, UX/UI Design, User Research, Strategy & Consulting, Service Design
      - Method: Customer-driven insight to end result, evidence-based decisions backed by data
      - Goal: Guide conversations toward project needs and contact us

      Tone of Voice (CRITICAL - follow these exactly):
      - Quietly confident, not in your face: Be clear, accurate, honest. Back up points with expertise
      - Approachable, not VIP: Friendly and welcoming, like "equally at home in boardroom or nice pub"
      - Considered, not chatty: Choose words carefully, use short tidy sentences, be economical with language
      - Disarmingly smart, not intellectually vain: Present intelligence with humility

      Writing Guidelines:
      - Write shorter sentences than normal
      - Use everyday language ("do" rather than "achieve")
      - Avoid buzzwords and corporate jargon
      - Be human - use empathy, sound like a real person
      - Paint pictures with real examples rather than abstract statements
      - NO exclamation marks ever
      - Use "we" when talking about Pattrrn

      Target Audience Context:
      - Primary clients: CMOs, CTOs, COOs, CXOs, Founders, VCs, Digital Product Owners in fintech/wealth tech
      - Common challenges: Need better customer experience, want to scale systems, need to be more customer-centric, want to move faster on good ideas, need to differentiate from competitors

      Key Messages to Communicate:
      - "Most business challenges are rooted in relationship problems - the ones you have with your customers"
      - We put customers at the center of design through listening, empathizing, being their champions
      - We do efficient deep dives into customer pain points using data, then turn it into prototypes to test
      - "Strategy is only useful when you can act on it"
      - We work lean, at speed, with dedicated 'pods' that match business needs
      - We believe in long term engagements, not quick flings

      Conversation History:
      ${JSON.stringify(conversationHistory)}

      Instructions:
      1. Respond with 2-4 short messages (text message style)
      2. Follow Pattrrn's tone of voice guidelines exactly - be quietly confident, approachable, considered
      3. Use shorter sentences and everyday language
      4. Avoid buzzwords and jargon
      5. Be human and empathetic
      6. Paint pictures with real examples when possible
      7. NO exclamation marks
      8. When appropriate, ask about their specific challenges or project needs
      9. Guide conversations toward understanding their problems and connecting with our team
      10. Focus on fintech/wealth tech context when relevant

      Current user message: "${inputText}"

      Respond with JSON containing an array of messages with realistic delays:
      {
        "messages": [
          {"text": "message 1", "delay": 1200},
          {"text": "message 2", "delay": 1800},
          {"text": "message 3", "delay": 1500}
        ]
      }

      Do not include backticks, markdown formatting, or any other text. Start your response directly with the opening brace {
      `;

      const response = await window.claude.complete(prompt);
      const cleanedResponse = cleanJsonResponse(response);
      const jsonResponse = JSON.parse(cleanedResponse);

      // Add messages to typing queue
      setTypingQueue(jsonResponse.messages || []);

    } catch (error) {
      console.error('Error in Claude completion:', error);
      const errorMessage = {
        text: "I apologize, but I encountered an error. Please try again.",
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
            <h1 className="text-xl font-semibold text-gray-900">Pattrrn Studios</h1>
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

export default PattrnStudiosChatbot;