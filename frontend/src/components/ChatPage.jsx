// ChatPage.jsx
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Send, Image as ImageIcon, ArrowLeft } from "lucide-react";

export default function ChatPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const person = location.state || { name: "Unknown", avatar: "" };

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { type: "text", content: input }]);
    setInput("");
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imgUrl = URL.createObjectURL(file);
      setMessages([...messages, { type: "image", content: imgUrl }]);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b">
        <button onClick={() => navigate(-1)} className="p-2">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <img src={person.avatar} alt={person.name} className="w-10 h-10 rounded-full" />
        <h2 className="font-bold">{person.name}</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.map((msg, i) => (
          <div key={i} className="flex">
            {msg.type === "text" ? (
              <div className="ml-auto bg-blue-500 text-white px-4 py-2 rounded-2xl">
                {msg.content}
              </div>
            ) : (
              <img src={msg.content} alt="sent" className="ml-auto max-w-[200px] rounded-lg" />
            )}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 border-t flex items-center gap-2">
        <label className="cursor-pointer">
          <ImageIcon className="w-6 h-6 text-gray-600" />
          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        </label>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 border rounded-full px-4 py-2"
          placeholder="Type a message..."
        />
        <button onClick={handleSend} className="bg-blue-500 p-2 rounded-full text-white">
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
