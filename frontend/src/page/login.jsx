import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post("http://localhost:8000/api/auth/login", {
        username,
        password,
      });

      if (response.status === 200) {
        const user = response.data.user;

        // ✅ Save token and user info
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(user));

        // ✅ Save role separately for navbar visibility
        localStorage.setItem("role", user.role);

        // ✅ Save username if needed elsewhere
        localStorage.setItem("username", user.username);

        // ✅ Redirect based on role
        if (user.role === "member") {
          navigate("/member", { replace: true });
        } else if (user.role === "admin") {
          navigate("/admin", { replace: true });
        } else if (user.role === "superadmin") {
          navigate("/admin", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      }
    } catch (err) {
      setError("Invalid username or password");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#a5b295] px-4">
      <div className="max-w-2xl mx-auto mt-10 grid grid-cols-2 gap-35 justify-items-center items-center relative">
        {/* Left Side - Logo Card */}
        <div className="bg-[#b8d8ba] z-10 shadow-lg rounded-3xl p-5 w-[450px]">
          <h2 className="text-7xl font-extrabold text-center mt-20 mb-20 text-gray-900">LOGO</h2>
          <h2 className="text-4xl font-bold text-center text-white">Welcome</h2>
          <h2 className="text-2xl font-semibold text-center text-white">Sign up now in coop</h2>
          <div className="mt-8 mb-28 justify-self-center">
            <Link
              to="/signup"
              className="text-center text-xl font-bold bg-white text-gray-700 px-14 py-5 rounded-4xl hover:bg-[#f0f0f0] transition"
            >
              Signup
            </Link>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="bg-white shadow-lg rounded-3xl p-8 w-[430px]">
          <h2 className="text-5xl font-extrabold text-center mt-5 mb-8 text-gray-900">CTHMC</h2>
          <h2 className="text-xl font-bold text-center mb-8 text-[#b8d8ba]">Login</h2>

          <form onSubmit={handleSubmit}>
            {error && <div className="text-red-600 text-sm mb-4">{error}</div>}

            <div className="ml-15 mr-15">
              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  required
                  className="w-full border-b-2 border-[#b8d8ba] focus:outline-none focus:border-[#a5b295] bg-transparent py-2 px-1"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              {/* Password */}
              <div className="mt-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    required
                    className="w-full border-b-2 border-[#b8d8ba] focus:outline-none focus:border-[#a5b295] bg-transparent py-2 px-1 pr-16"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-2 text-sm text-[#a5b295] font-semibold"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* Forgot Password */}
              <div className="text-right">
                <Link to="/forgot-password" className="text-sm text-[#a5b295] hover:underline">
                  Forgot password?
                </Link>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full mt-10 mb-12 bg-[#b8d8ba] text-white py-2 rounded-4xl font-semibold hover:bg-[#8f9f7e] transition"
              >
                Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
