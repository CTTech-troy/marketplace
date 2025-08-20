// MessageList.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

const people = [
  { id: 1, name: "Alice", avatar: "https://i.pravatar.cc/50?img=1" },
  { id: 2, name: "Bob", avatar: "https://i.pravatar.cc/50?img=2" },
  { id: 3, name: "Charlie", avatar: "https://i.pravatar.cc/50?img=3" },
];

export default function MessageList() {
  const navigate = useNavigate();

  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">People</h2>
      <ul className="space-y-4">
        {people.map((person) => (
          <li key={person.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <img src={person.avatar} alt={person.name} className="w-10 h-10 rounded-full" />
              <span className="font-medium">{person.name}</span>
            </div>
            <button
              onClick={() => navigate(`/chat/${person.id}`, { state: person })}
              className="bg-blue-500 text-white px-4 py-1 rounded-lg hover:bg-blue-600"
            >
              Send Message
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
