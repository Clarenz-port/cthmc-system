import React from "react";

export default function PurposeSection({ purpose, setPurpose }) {
  return (
    <div>
      <label className="block text-gray-700 font-semibold mb-1">Purpose</label>
      <select
        value={purpose}
        onChange={(e) => setPurpose(e.target.value)}
        required
        className="w-full border border-[#b8d8ba] rounded-sm px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#7e9e6c]"
      >
        <option value="">Select purpose</option>
        <option value="Business">Business</option>
        <option value="Education">Education</option>
        <option value="Personal">Personal</option>
      </select>
    </div>
  );
}
