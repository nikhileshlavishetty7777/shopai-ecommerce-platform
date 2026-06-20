import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMessageCircle, FiX, FiSend, FiStar } from 'react-icons/fi';
import { toggleChatbot } from '../../redux/slices/uiSlice';
import { aiService } from '../../services/endpoints';

const ChatbotWidget = () => {
  const dispatch = useDispatch();
  const { isChatbotOpen } = useSelector((s) => s.ui);
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      message: "👋 Hi! I'm your AI shopping assistant. I can help you find products, track orders, and answer questions!",
      suggestions: ['Search products', 'Track my order', 'Show trending', 'View categories'],
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { type: 'user', message: text }]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await aiService.chat({ message: text });
      setMessages((prev) => [...prev, { type: 'bot', ...data }]);
    } catch (err) {
      setMessages((prev) => [...prev, { type: 'bot', message: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => dispatch(toggleChatbot())}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-primary shadow-glow flex items-center justify-center text-white"
      >
        {isChatbotOpen ? <FiX size={22} /> : <FiMessageCircle size={22} />}
      </motion.button>

      <AnimatePresence>
        {isChatbotOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-40 w-[calc(100vw-3rem)] sm:w-96 h-[500px] glass-card flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-gradient-primary rounded-t-2xl">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <FiMessageCircle className="text-white" size={18} />
              </div>
              <div>
                <p className="font-semibold text-white text-sm">AI Shopping Assistant</p>
                <p className="text-white/70 text-xs">Always here to help</p>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] ${msg.type === 'user' ? 'order-2' : ''}`}>
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-sm whitespace-pre-line ${
                        msg.type === 'user' ? 'bg-gradient-primary text-white' : 'bg-surfaceLight'
                      }`}
                    >
                      {msg.message}
                    </div>

                    {msg.products && (
                      <div className="mt-2 space-y-2">
                        {msg.products.map((p) => (
                          <Link
                            key={p.id}
                            to={`/products/${p.slug || p.id}`}
                            onClick={() => dispatch(toggleChatbot())}
                            className="flex items-center gap-3 bg-surfaceLight/50 p-2 rounded-xl hover:bg-surfaceLight transition-colors"
                          >
                            <img src={p.thumbnail} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">{p.name}</p>
                              <p className="text-xs text-primary font-semibold">₹{p.price?.toLocaleString()}</p>
                            </div>
                            {p.rating > 0 && (
                              <span className="flex items-center gap-0.5 text-xs text-gray-400">
                                <FiStar size={10} className="text-warning fill-warning" /> {p.rating?.toFixed(1)}
                              </span>
                            )}
                          </Link>
                        ))}
                      </div>
                    )}

                    {msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {msg.suggestions.map((s, j) => (
                          <button
                            key={j}
                            onClick={() => sendMessage(s)}
                            className="text-xs px-3 py-1.5 rounded-full border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-surfaceLight rounded-2xl px-4 py-3 flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                        className="w-1.5 h-1.5 rounded-full bg-gray-400"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
              className="p-3 border-t border-white/10 flex gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                className="input-field py-2.5 text-sm flex-1"
              />
              <button type="submit" className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center text-white flex-shrink-0">
                <FiSend size={16} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatbotWidget;
