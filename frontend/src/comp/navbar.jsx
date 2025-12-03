import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { FaBars, FaTimes } from "react-icons/fa";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isInAboutSection, setIsInAboutSection] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const aboutSection = document.getElementById("about");
      const scrollY = window.scrollY;
      if (aboutSection) {
        const offsetTop = aboutSection.offsetTop;
        const offsetHeight = aboutSection.offsetHeight;

        if (scrollY >= offsetTop - 100 && scrollY < offsetTop + offsetHeight) {
          setIsInAboutSection(true);
        } else {
          setIsInAboutSection(false);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-20 transition-colors duration-300 ${
        isInAboutSection ? "bg-[#b8d8ba] " : "bg-white shadow-md"
      }`}
    >
      <div className="max-w-400 mx-auto px-4 py-6 flex items-center justify-between relative">
        <Link to="/" state={{ scrollTo: "home" }} className="text-3xl font-extrabold text-gray-800 flex-none">CTHMC</Link>

        <div className="hidden md:flex space-x-8 absolute left-1/2 transform -translate-x-1/2">
  <Link
    to="/"
    state={{ scrollTo: "home" }}
    className={`relative nopsa-text font-semibold text-gray-700 text-md ml-20 mr-10 group 
      ${isInAboutSection ? "hover:text-[#f0f0f0]" : "hover:text-[#a5b295]"}`}
  >
    Home
    <span className="absolute left-0 -bottom-1 h-0.5 w-0 bg-[#a5b295] transition-all duration-300 ease-out group-hover:w-full"></span>
  </Link>

  <Link
    to="/"
    state={{ scrollTo: "about" }}
    className={`relative font-semibold nopsa-text text-gray-700 text-md mr-10 group 
      ${isInAboutSection ? "hover:text-[#f0f0f0]" : "hover:text-[#a5b295]"}`}
  >
    About
    <span className="absolute left-0 -bottom-1 h-0.5 w-0 bg-[#a5b295] transition-all duration-300 ease-out group-hover:w-full"></span>
  </Link>

  <Link
    to="/"
    state={{ scrollTo: "contact" }}
    className={`relative font-semibold nopsa-text text-gray-700 text-md mr-35 xl:mr-1 group 
      ${isInAboutSection ? "hover:text-[#f0f0f0]" : "hover:text-[#a5b295]"}`}
  >
    Contact
    <span className="absolute left-0 -bottom-1 h-0.5 w-0 bg-[#a5b295] transition-all duration-300 ease-out group-hover:w-full"></span>
  </Link>
</div>

        <div className="hidden md:flex items-center font-bold ml-4 lg:ml-8 flex-none">
          <Link to="/login" className={`px-4 text-center py-2 rounded-4xl w-20 text-sm sm:w-36 sm:text-base lg:w-50 lg:text-lg transition-all
            ${isInAboutSection ? 'bg-white text-gray-700 hover:bg-[#f0f0f0]' : 'bg-[#b8d8ba] text-white hover:bg-[#a5b295]'}`}>
            Login
          </Link>
        </div>

        <button
          className="md:hidden text-gray-800"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button>
      </div>

      {isOpen && (
        <div className="md:hidden fixed top-17 left-0 right-0 bg-white shadow-lg py-6 px-6 flex flex-col items-center space-y-4 z-20">
          <Link to="/" state={{ scrollTo: "home" }} className="block font-semibold nopsa-text text-gray-700 hover:text-blue-600">Home</Link>
          <Link to="/" state={{ scrollTo: "about" }} className="block font-semibold nopsa-text text-gray-700 hover:text-blue-600">About</Link>
          <Link to="/" state={{ scrollTo: "contact" }} className="block font-semibold nopsa-text text-gray-700 hover:text-blue-600">Contact</Link>
          <Link to="/login" className="w-40 text-center font-bold bg-[#b8d8ba] text-white px-4 py-2 rounded-4xl hover:bg-[#a5b295] transition">
            Login
          </Link>
        </div>
      )}
    </nav>
  );
}