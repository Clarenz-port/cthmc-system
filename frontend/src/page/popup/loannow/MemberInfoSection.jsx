import React from "react";

export default function MemberInfoSection({ memberName, address }) {
  return (
    <>
      <div>
        <label className="block text-gray-700 font-semibold mb-1">Member Name</label>
        <input
          type="text"
          value={memberName}
          readOnly
          className="w-full border border-[#b8d8ba] rounded-sm px-4 py-2 bg-gray-100"
        />
      </div>

      <div>
        <label className="block text-gray-700 font-semibold mb-1">Address</label>
        <input
          type="text"
          value={address}
          readOnly
          className="w-full border border-[#b8d8ba] rounded-sm px-4 py-2 bg-gray-100"
        />
      </div>
    </>
  );
}
