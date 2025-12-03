import React, { useState } from "react";

export default function ManageNotice({ onBack }) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [notices, setNotices] = useState([]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !message) {
      alert("Please fill out both fields.");
      return;
    }

    const newNotice = { id: Date.now(), title, message };
    setNotices([...notices, newNotice]);
    setTitle("");
    setMessage("");
  };

  const handleDelete = (id) => {
    setNotices(notices.filter((n) => n.id !== id));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-extrabold">Manage Notice</h1>
        <button
          onClick={onBack}
          className="bg-[#7e9e6c] text-white px-6 py-2 rounded-lg text-lg hover:bg-[#6c8c5f]"
        >
          Back to Dashboard
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md p-6 rounded-lg border border-gray-200 mb-6"
      >
        <h2 className="text-2xl font-semibold mb-4">Create a New Notice</h2>

        <input
          type="text"
          placeholder="Notice Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border border-gray-300 rounded px-4 py-2 mb-3 focus:outline-none"
        />

        <textarea
          placeholder="Notice Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full border border-gray-300 rounded px-4 py-2 h-32 resize-none mb-4 focus:outline-none"
        ></textarea>

        <button
          type="submit"
          className="bg-[#7e9e6c] text-white px-6 py-2 rounded-lg text-lg hover:bg-[#6c8c5f]"
        >
          Post Notice
        </button>
      </form>

      <div>
        <h2 className="text-2xl font-semibold mb-3">Posted Notices</h2>
        {notices.length === 0 ? (
          <p className="text-gray-500">No notices yet.</p>
        ) : (
          <ul className="space-y-4">
            {notices.map((notice) => (
              <li
                key={notice.id}
                className="bg-[#f9f9f9] border border-gray-300 rounded-lg p-4"
              >
                <h3 className="text-xl font-bold text-[#7e9e6c]">
                  {notice.title}
                </h3>
                <p className="text-gray-700 mt-2">{notice.message}</p>
                <button
                  onClick={() => handleDelete(notice.id)}
                  className="mt-3 bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}