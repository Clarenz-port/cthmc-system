import React, { useEffect, useRef, useState } from "react";
import axios from "axios";

/**
 * AddBillPaymentPopup
 *
 * Props:
 * - isOpen: boolean
 * - onClose: fn
 * - memberId: number|string (optional)
 * - onSaved: fn(response) called after successful save
 *
 * Notes:
 * - If a receipt file is picked, sends multipart/form-data; otherwise sends JSON.
 * - Adjust API endpoint "/api/bills/add" if your backend uses a different route.
 */

export default function AddBillPaymentPopup({ isOpen, onClose, memberId, onSaved }) {
  const overlayRef = useRef(null);
  const firstFieldRef = useRef(null);

  const [billName, setBillName] = useState("");
  const [amount, setAmount] = useState(""); // store as string for nicer UX
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]); // yyyy-mm-dd
  const [method, setMethod] = useState("cash");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [receiptFile, setReceiptFile] = useState(null);

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => firstFieldRef.current?.focus(), 50);
      // reset error flags when opened
      setErrors({});
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // sanitize amount input: allow digits and optionally one dot
  const sanitizeAmountInput = (value) => {
    let cleaned = value.replace(/[^\d.]/g, "");
    const parts = cleaned.split(".");
    if (parts.length > 2) {
      cleaned = parts[0] + "." + parts.slice(1).join("");
    }
    return cleaned;
  };

  // human-friendly display of number
  const formatCurrency = (val) => {
    const n = Number(val || 0);
    return n.toLocaleString("en-PH", { style: "currency", currency: "PHP", minimumFractionDigits: 2 });
  };

  // validate fields and set errors object
  const validate = () => {
    const e = {};
    if (!billName.trim()) e.billName = "Bill name is required.";
    const numericAmount = Number(amount || 0);
    if (!amount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      e.amount = "Enter a valid amount (greater than 0).";
    }
    if (!date) e.date = "Date is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleFileChange = (file) => {
    // optional: restrict file size/type here
    if (!file) {
      setReceiptFile(null);
      return;
    }
    // limit to 5MB for example
    if (file.size > 5 * 1024 * 1024) {
      alert("Receipt is too large (max 5MB). Please pick a smaller file.");
      return;
    }
    setReceiptFile(file);
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);

    try {
      const token = localStorage.getItem("token");
      const payload = {
        memberId,
        billName: billName.trim(),
        amount: Number(amount || 0),
        date,
        paymentMethod: method,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      let res;

      if (receiptFile) {
        // send multipart if file present
        const fd = new FormData();
        fd.append("billName", payload.billName);
        fd.append("amount", String(payload.amount));
        fd.append("date", payload.date);
        fd.append("paymentMethod", payload.paymentMethod);
        if (payload.reference) fd.append("reference", payload.reference);
        if (payload.notes) fd.append("notes", payload.notes);
        if (payload.memberId) fd.append("memberId", String(payload.memberId));
        fd.append("receipt", receiptFile, receiptFile.name);

        res = await axios.post("/api/bills/add", fd, {
          headers: {
            "Content-Type": "multipart/form-data",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
      } else {
        // send JSON
        res = await axios.post("/api/bills/add", payload, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
      }

      // success
      alert("Bill payment recorded!");
      onSaved && onSaved(res.data);
      // reset local state (useful if popup stays open)
      setBillName("");
      setAmount("");
      setDate(new Date().toISOString().split("T")[0]);
      setMethod("cash");
      setReference("");
      setNotes("");
      setReceiptFile(null);
      setErrors({});
      onClose && onClose();
    } catch (err) {
      console.error("Error saving bill payment:", err);
      const msg = err?.response?.data?.message || err.message || "Failed to save bill payment";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black/45 flex items-center justify-center z-50 p-4"
      onMouseDown={(e) => {
        // close when clicking the overlay (not the modal)
        if (e.target === overlayRef.current) onClose?.();
      }}
      aria-modal="true"
      role="dialog"
      aria-labelledby="bill-popup-title"
    >
      <div className="bg-white w-full max-w-lg mt-16 mb-16 rounded-xl shadow-lg p-6">
        <div className="flex border-b border-[#dce9dd] items-start justify-between mb-4">
          <div>
            <h2 id="bill-popup-title" className="text-2xl font-bold text-[#246033]">
              Record Bill Payment
            </h2>
            <p className="text-sm text-gray-500 mb-2 mt-1">Record a payment for this member.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {/* Bill name */}
          <label className="text-sm font-semibold">Bill Name <span className="text-red-500">*</span></label>
          <input
            ref={firstFieldRef}
            type="text"
            value={billName}
            onChange={(e) => setBillName(e.target.value)}
            placeholder="Electricity / Water / Loan Payment / Other"
            className={`w-full border shadow-md border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-[#7e9e6c] ${
              errors.billName ? "border-red-400 focus:ring-red-200" : "focus:ring-[#7e9e6c]"
            }`}
            aria-invalid={!!errors.billName}
          />
          {errors.billName && <div className="text-red-500 text-sm">{errors.billName}</div>}

          {/* Amount + Payment method row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold">Amount (₱) <span className="text-red-500">*</span></label>
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(sanitizeAmountInput(e.target.value))}
                placeholder="0.00"
                className={`w-full border shadow-md border-gray-300 rounded-md p-2 text-right focus:outline-none focus:ring-2 focus:ring-[#7e9e6c] ${
                  errors.amount ? "border-red-400 focus:ring-red-200" : "focus:ring-[#7e9e6c]"
                }`}
                aria-invalid={!!errors.amount}
              />
              {errors.amount ? (
                <div className="text-red-500 text-sm mt-1">{errors.amount}</div>
              ) : (
                <div className="text-xs text-gray-500 mt-1">{amount ? formatCurrency(Number(amount)) : "Enter an amount"}</div>
              )}
            </div>

            <div>
              <label className="text-sm font-semibold">Payment method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full border shadow-md border-gray-300 rounded-md p-2 text-right focus:outline-none focus:ring-2 focus:ring-[#7e9e6c]"
              >
                <option value="cash">Cash</option>
                <option value="gcash">GCash</option>
              </select>
            </div>

          </div>

          {/* Date + receipt */}
          <div className="grid grid-cols- gap-3 items-start">
            <div>
              <label className="text-sm font-semibold">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border shadow-md border-gray-300 rounded-md p-2 text-right focus:outline-none focus:ring-2 focus:ring-[#7e9e6c]"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 border-t border-[#dce9dd] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className=" bg-white shadow-md border border-[#e6b6a6] font-semibold hover:bg-[#f8f2f1] text-[#c55f4f] px-4 py-2 mt-3 rounded"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 shadow-md mt-3 bg-[#7e9e6c] text-white rounded hover:bg-[#6a8b5a] disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}
