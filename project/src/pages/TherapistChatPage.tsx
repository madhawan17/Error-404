import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Bot, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: string;
}

const INITIAL_AI_MESSAGE: Message = {
  id: '1',
  text: "Hello! I'm here to listen and support you on your wellness journey. How are you feeling today?",
  sender: 'ai',
  timestamp: new Date().toISOString(),
};

// ✅ Use your GroqCloud API key!
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
console.log("✅ Groq API KEY:", GROQ_API_KEY ? "Loaded" : "NOT FOUND");

// ✅ Correct GroqCloud call function
async function callGroqAI(userMessage: string): Promise<string> {
  const API_URL = "https://api.groq.com/openai/v1/chat/completions";

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama3-70b-8192", // ✅ Groq-supported model
        messages: [
          { role: "system", content: "You are a supportive AI therapist." },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Groq API Error:", errorData);
      const errorMessage =
        errorData?.error?.message || `Request failed with status ${response.status}`;
      return `Error from AI service: ${errorMessage}. Please check your Groq setup and API key.`;
    }

    const data = await response.json();
    console.log("✅ Groq Response:", data);

    const text = data?.choices?.[0]?.message?.content;
    if (!text) {
      console.error("❌ Invalid response structure from Groq:", data);
      return "Sorry, I received an unexpected response from the AI. Please try again.";
    }

    return text;
  } catch (e) {
    console.error("❌ Network or Fetch Error:", e);
    return "Sorry, I'm having trouble connecting to the AI service. Please check your network and API key setup.";
  }
}

export function TherapistChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem('chatHistory');
    if (savedHistory) {
      setMessages(JSON.parse(savedHistory));
    } else {
      setMessages([INITIAL_AI_MESSAGE]);
      localStorage.setItem('chatHistory', JSON.stringify([INITIAL_AI_MESSAGE]));
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const saveMessagesToStorage = (newMessages: Message[]) => {
    localStorage.setItem('chatHistory', JSON.stringify(newMessages));
  };

  // ✅ Now using GroqCloud
  const generateAIResponse = async (userInput: string): Promise<string> => {
    return await callGroqAI(userInput);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    saveMessagesToStorage(updatedMessages);
    setInputText('');
    setIsLoading(true);

    try {
      const aiReply = await generateAIResponse(userMessage.text);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiReply,
        sender: 'ai',
        timestamp: new Date().toISOString(),
      };

      const finalMessages = [...updatedMessages, aiMessage];
      setMessages(finalMessages);
      saveMessagesToStorage(finalMessages);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const clearChat = () => {
    const confirmClear = window.confirm('Are you sure you want to clear the chat history?');
    if (confirmClear) {
      setMessages([INITIAL_AI_MESSAGE]);
      localStorage.setItem('chatHistory', JSON.stringify([INITIAL_AI_MESSAGE]));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col h-screen bg-gradient-to-br from-[#C8E6C9] to-[#E0F7FA] p-6"
    >
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-center justify-between mb-4"
      >
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center"
        >
          <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.5 }}>
            <MessageCircle className="h-8 w-8 text-green-600 mr-3" />
          </motion.div>
          <h1 className="text-green-900 font-bold text-2xl">AI Therapist</h1>
        </motion.div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={clearChat}
          className="text-sm text-green-700 hover:text-green-900 px-3 py-1 rounded-md hover:bg-green-100 transition-colors duration-200"
        >
          Clear Chat
        </motion.button>
      </motion.div>

      {/* Messages Container */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex-1 overflow-y-auto space-y-4 mb-4 bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-green-100"
      >
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{
                duration: 0.3,
                delay: index === messages.length - 1 ? 0 : 0.1,
              }}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                className={`flex items-start space-x-2 max-w-lg lg:max-w-5xl ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
              >
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${message.sender === 'user' ? 'bg-green-600' : 'bg-green-100'
                    }`}
                >
                  {message.sender === 'user' ? (
                    <User className="h-5 w-5 text-white" />
                  ) : (
                    <Bot className="h-5 w-5 text-green-600" />
                  )}
                </motion.div>
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className={`rounded-lg p-3 w-full break-words ${message.sender === 'user'
                      ? 'bg-green-600 text-white'
                      : 'bg-white text-gray-800'
                    }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <span
                    className={`text-xs mt-1 block ${message.sender === 'user' ? 'text-green-100' : 'text-gray-500'
                      }`}
                  >
                    {formatTime(message.timestamp)}
                  </span>
                </motion.div>
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </motion.div>

      {/* Input Area */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex space-x-2"
      >
        <motion.textarea
          whileFocus={{ scale: 1.02 }}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          className="flex-1 p-3 rounded-lg border border-green-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none transition-all duration-200"
          rows={1}
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSendMessage}
          disabled={!inputText.trim() || isLoading}
          className="p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {isLoading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Send className="h-5 w-5" />
            </motion.div>
          ) : (
            <Send className="h-5 w-5" />
          )}
        </motion.button>
      </motion.div>

      {/* Disclaimer */}
      <div className="mt-4 text-center">
        <p className="text-xs text-green-700 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
          This AI assistant provides supportive conversation but is not a replacement for professional therapy.
          If you're experiencing a mental health crisis, please contact a healthcare professional or emergency services.
        </p>
      </div>
    </motion.div>
  );
}
