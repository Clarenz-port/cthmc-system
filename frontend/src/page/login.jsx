import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";

/* =========================
   ERROR POPUP COMPONENT
========================= */
function ErrorPopup({ message }) {
  if (!message) return null;

  return (
    <div className="absolute -right-46 top-6 -translate-y- z-50">
      <div className="relative bg-red-600 text-white text-sm font-semibold px-4 py-3 rounded-lg shadow-lg w-38">
        {message}

        {/* Arrow */}
        <div
          className="absolute left-[-8px] top-6 -translate-y-1/2 
          w-0 h-0 border-t-8 border-b-8 border-r-8
          border-t-transparent border-b-transparent border-r-red-600"
        />
      </div>
    </div>
  );
}

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

        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("role", user.role);
        localStorage.setItem("username", user.username);

        if (user.role === "member") {
          navigate("/member", { replace: true });
        } else {
          navigate("/admin", { replace: true });
        }
      }
    } catch (err) {
      setError(
        "The username or password that you've entered doesn't match any account."
      );
      console.error(err);
    }
  };

  return (
    <div
      className="relative min-h-screen flex items-center bg-cover bg-center overflow-hidden"
      style={{ backgroundImage: "url('/images/finance-bg.png')" }}
    >
      {/* OVERLAY */}
      <div className="absolute inset-0 bg-[#DFE8DF]/50"></div>

      {/* LIGHT SWEEP */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[40%] h-full bg-white/40 blur-3xl animate-[lightSweep_18s_ease-in-out_infinite]" />
      </div>

      {/* SHAPES */}
      <div className="absolute right-0 top-0 w-[60%] h-full opacity-40 pointer-events-none">
        <div className="absolute -top-24 right-[-120px] w-[500px] h-[500px] rounded-full bg-emerald-700/60"></div>
        <div className="absolute top-[200px] right-[-200px] w-[600px] h-[600px] rounded-full bg-emerald-800/60"></div>
      </div>

      <div className="max-w-3xl right-10 gap-20 mx-auto mt-10 grid grid-cols-2 relative">
        {/* LEFT */}
        <div className="bg-emerald-800 z-10 shadow-lg rounded-3xl p-5 w-[450px]">
          <h2 className="text-7xl font-extrabold text-center mt-20 mb-20 text-white">
            LOGO
          </h2>
          <h2 className="text-5xl font-extrabold text-center text-white">
            Welcome
          </h2>
          <h2 className="font-semibold mt-2 text-center text-white">
            Sign up now in coop
          </h2>
          <div className="mt-8 mb-28 justify-self-center">
            <Link
              to="/signup"
              className="text-center text-xl font-bold bg-white text-emerald-800 px-14 py-5 rounded-4xl hover:bg-[#f0f0f0] transition"
            >
              Signup
            </Link>
          </div>
        </div>

        {/* RIGHT */}
        <div className="bg-emerald-50 shadow-lg rounded-3xl p-8 w-[430px]">
          <h2 className="text-5xl font-extrabold text-center mt-5 mb-8 text-emerald-800">
            CTHMC
          </h2>
          <h2 className="text-xl font-bold text-center mb-8 text-emerald-800">
            Login
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="ml-15 mr-15">
              {/* USERNAME */}
              <div className="relative">
                <label className="block text-sm font-medium text-emerald-800 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  required
                  className={`w-full border-b-2 bg-transparent py-2 px-1 focus:outline-none ${
                    error ? "border-red-500" : "border-emerald-800"
                  }`}
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError("");
                  }}
                />
                <ErrorPopup message={error} />
              </div>

              {/* PASSWORD */}
              <div className="mt-2 relative">
                <label className="block text-sm font-medium text-emerald-800 mb-1">
                  Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className={`w-full border-b-2 bg-transparent py-2 px-1 pr-16 focus:outline-none ${
                    error ? "border-red-500" : "border-emerald-800"
                  }`}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-8 text-sm text-emerald-800 font-semibold"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>

   
              </div>

              {/* FORGOT */}
              <div className="text-right">
                <Link
                  to="/forgot-password"
                  className="text-sm text-emerald-800 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              {/* SUBMIT */}
              <button
                type="submit"
                className="w-full mt-10 mb-12 bg-emerald-800 text-white py-2 rounded-4xl font-semibold hover:bg-[#8f9f7e] transition"
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
