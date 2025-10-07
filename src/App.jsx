import { useState, useEffect, useRef } from "react";
import OpenAI from "openai";
import { FaMicrophone } from "react-icons/fa";

const client = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export default function App() {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("chatMessages");
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const inputRef = useRef(null);
  const chatContainerRef = useRef(null);

  const NAVBAR_HEIGHT = 80;
  const INPUT_BAR_HEIGHT = 80;

  useEffect(() => inputRef.current?.focus(), []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    localStorage.setItem("chatMessages", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = "en-US";
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const newMessage = { role: "user", content: transcript, time: new Date() };
        const updatedMessages = [...messages, newMessage];
        setMessages(updatedMessages);
        setListening(false);
        setInput("");
        sendToAI(updatedMessages);
      };

      recognition.onend = () => setListening(false);
      recognitionRef.current = recognition;
    }
  }, [messages]);

  const adjustChatHeight = () => {
    const vh = window.innerHeight;
    if (chatContainerRef.current) {
      chatContainerRef.current.style.height = `${vh - NAVBAR_HEIGHT - INPUT_BAR_HEIGHT - 20}px`;
    }
  };

  useEffect(() => {
    adjustChatHeight();
    window.addEventListener("resize", adjustChatHeight);
    window.addEventListener("orientationchange", adjustChatHeight);
    const inputEl = inputRef.current;
    inputEl?.addEventListener("focus", adjustChatHeight);
    inputEl?.addEventListener("blur", adjustChatHeight);
    return () => {
      window.removeEventListener("resize", adjustChatHeight);
      window.removeEventListener("orientationchange", adjustChatHeight);
      inputEl?.removeEventListener("focus", adjustChatHeight);
      inputEl?.removeEventListener("blur", adjustChatHeight);
    };
  }, []);

  const sendToAI = async (updatedMessages) => {
    setLoading(true);
    try {
      const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: updatedMessages,
      });
      const aiMessage = {
        role: "assistant",
        content: response.choices[0].message.content,
        time: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error(error);
      alert("Error fetching AI response.");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const newMessage = { role: "user", content: input, time: new Date() };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setInput("");
    sendToAI(updatedMessages);
  };

  const handleVoice = () => {
    if (recognitionRef.current) {
      if (listening) recognitionRef.current.stop();
      else recognitionRef.current.start();
      setListening(!listening);
    } else alert("Your browser does not support voice input.");
  };

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col items-center justify-start">
      <div
        className="fixed top-0 left-0 w-full bg-white shadow-md z-50 mx-auto flex justify-center items-center px-4"
        style={{ height: NAVBAR_HEIGHT }}
      >
        <div className="flex items-center justify-center mx-auto gap-3">
          <div>
            <img className="w-12" src="https://i.postimg.cc/vHgLSQN2/ai.jpg" alt="AI Logo" />
          </div>
          <div>
            <h1 className="text-[#4A90E2] text-2xl sm:text-3xl font-bold text-center">
              Echo Ai
            </h1>
          </div>
        </div>
      </div>

      <div
        ref={chatContainerRef}
        className="flex flex-col w-full max-w-xl sm:max-w-2xl mt-[80px] mb-[100px] px-3 overflow-y-auto space-y-3"
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} items-end gap-2`}
          >
            {msg.role === "assistant" && <img className="w-10 rounded-full" src="https://i.postimg.cc/vHgLSQN2/ai.jpg" alt="AI" />}
            <div
              className={`px-4 py-2 rounded-2xl shadow-md break-words max-w-[70%] sm:max-w-[75%]`}
              style={{
                backgroundColor: msg.role === "user" ? "#DCF8C6" : "#EDEDED",
                boxShadow: msg.role === "user"
                  ? "0 2px 6px rgba(0,0,0,0.15)"
                  : "0 2px 6px rgba(0,0,0,0.08)",
              }}
            >
              <p className="text-sm sm:text-base">{msg.content}</p>
              <div className="text-xs text-gray-500 mt-1 text-right">{formatTime(msg.time)}</div>
            </div>
            {msg.role === "user" && <img className="w-10 rounded-full" src="https://i.postimg.cc/ZKBFDTMM/user.jpg" alt="User" />}
          </div>
        ))}
        {loading && (
          <div className="flex gap-2 justify-start items-center animate-pulse">
            <div className="px-3 py-2 rounded-2xl flex gap-1 items-center bg-gray-200 shadow-inner">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-300"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="fixed bottom-0 left-0 w-full max-w-xl sm:max-w-2xl flex flex-col items-center px-3 py-3 bg-white shadow-md rounded-t-3xl z-50">
        <div className="w-full flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            className="flex-1 px-4 py-3 text-gray-800 placeholder-gray-500 bg-gray-100 rounded-full outline-none text-sm sm:text-base"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <div className="relative flex items-center">
            <button
              onClick={handleVoice}
              className={`p-3 rounded-full flex items-center justify-center text-white transition ${
                listening ? "bg-red-500" : "bg-green-500"
              } shadow-lg`}
            >
              <FaMicrophone size={22} />
            </button>
            {listening && (
              <>
                <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-red-500 animate-ping"></div>
                <div className="flex gap-1 ml-2">
                  {[...Array(3)].map((_, i) => (
                    <span
                      key={i}
                      className="w-1.5 h-4 bg-red-500 rounded animate-bounce"
                      style={{ animationDelay: `${i * 0.2}s` }}
                    ></span>
                  ))}
                </div>
              </>
            )}
          </div>
          <button
            onClick={handleSend}
            disabled={loading}
            className="bg-[#4A90E2] text-white px-5 py-3 rounded-full hover:opacity-90 transition active:scale-95 shadow-md"
          >
            {loading ? "Sending..." : "Send"}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Developed by <a className="font-semibold" href="https://nazmul-haque-rahat.web.app/">Nazmul Haque Rahat</a>
        </p>
      </div>

      <style>{`
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        .animate-bounce { animation: bounce 0.6s infinite alternate; }
        .animate-ping { animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite; }
        @keyframes ping { 0% { transform: scale(1); opacity: 1; } 75%, 100% { transform: scale(2); opacity: 0; } }
      `}</style>
    </div>
  );
}
