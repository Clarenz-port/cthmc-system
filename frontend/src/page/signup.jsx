import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

export default function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    street: "",
    block: "",
    lot: "",
    email: "",          // ✅ added
    birthdate: "",      // ✅ added
    username: "",
    phone_number: "",
    password: "",
    confirmPassword: "",
    agree: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");

  // Handles typing in inputs
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handles form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setError("");

      await axios.post("http://localhost:8000/api/auth/register", {
        firstName: form.first_name,
        middleName: form.middle_name,
        lastName: form.last_name,
        street: form.street,
        block: form.block,
        lot: form.lot,
        email: form.email,              // ✅ added
        birthdate: form.birthdate,      // ✅ added
        phoneNumber: form.phone_number,
        username: form.username,
        password: form.password,
        confirmPassword: form.confirmPassword,
      });

      alert("Registration successful!");
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#a5b295] px-4">
      <div className="max-w-4xl gap- mx-auto mt-10 grid grid-cols-2">

        {/* Left Panel */}
        <div className="bg-[#b8d8ba] shadow-lg rounded-3xl p-8 w-[470px]">
          <h2 className="text-5xl font-extrabold mt-25 text-center text-gray-900">LOGO</h2>
          <h2 className="text-4xl mt-20 font-bold text-center text-white">Welcome</h2>
          <p className="text-center text-white mt-2">Already have an account?</p>
          <div className="mt-5 text-center">
            <Link
              to="/login"
              className="text-center text-xl font-bold bg-white text-gray-700 px-14 py-5 rounded-4xl hover:bg-[#f0f0f0] transition"
            >
              Login
            </Link>
          </div>
        </div>

        {/* Signup Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-lg rounded-3xl p-8 w-[460px] space-y-3"
        >
          <h2 className="text-4xl font-bold text-center text-[#b8d8ba]">Create your account</h2>

          {/* Name Fields */}
          <input name="first_name" placeholder="First Name" required value={form.first_name} onChange={handleChange} className="form-input" />
          <input name="middle_name" placeholder="Middle Name" value={form.middle_name} onChange={handleChange} className="form-input" />
          <input name="last_name" placeholder="Last Name" required value={form.last_name} onChange={handleChange} className="form-input" />

          {/* Email (added) */}
          <input
            name="email"
            placeholder="Email"
            type="email"
            required
            value={form.email}
            onChange={handleChange}
            className="form-input"
          />

          {/* Birthdate (added) */}
          <input
            name="birthdate"
            type="date"
            required
            value={form.birthdate}
            onChange={handleChange}
            className="form-input"
          />

          {/* Address */}
          <div className="flex gap-2">
            <input name="street" placeholder="Street" value={form.street} onChange={handleChange} className="form-input w-full" />
            <input name="block" placeholder="Block" value={form.block} onChange={handleChange} className="form-input w-full" />
            <input name="lot" placeholder="Lot" value={form.lot} onChange={handleChange} className="form-input w-full" />
          </div>

          {/* Account Info */}
          <input name="phone_number" placeholder="Phone Number" type="tel" required value={form.phone_number} onChange={handleChange} className="form-input" />
          <input name="username" placeholder="Username" required value={form.username} onChange={handleChange} className="form-input" />
          

          {/* Password */}
          <div className="relative">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              required
              value={form.password}
              onChange={handleChange}
              className="form-input pr-16"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-2 text-sm text-[#a5b295]">
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <div className="relative">
            <input
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm Password"
              required
              value={form.confirmPassword}
              onChange={handleChange}
              className="form-input pr-16"
            />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-2 top-2 text-sm text-[#a5b295]">
              {showConfirmPassword ? "Hide" : "Show"}
            </button>
          </div>

          {/* Agreement */}
          <div className="flex items-center">
            <input type="checkbox" name="agree" checked={form.agree} onChange={handleChange} />
            <label className="ml-2 text-sm">
              I agree to the <span className="text-[#4caf50] font-medium">Terms & Conditions</span>
            </label>
          </div>

          {/* Error */}
          {error && <p className="text-red-500 text-center text-sm">{error}</p>}

          {/* Submit */}
          <button
            type="submit"
            disabled={!form.agree}
            className="w-full bg-[#b8d8ba] hover:bg-[#a5b295] text-white font-bold py-3 rounded-3xl mt-2"
          >
            Register
          </button>
        </form>
      </div>
    </div>
  );
}
