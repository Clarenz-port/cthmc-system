import hds from '../design/homede (1).png';
import ads from '../design/aboutde (1).png';
import { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";

export default function Home() {
  const location = useLocation();

useEffect(() => {
  const scrollTo = location.state?.scrollTo;
  if (scrollTo) {
    const element = document.getElementById(scrollTo);
    if (element) {
      // Scroll to the section smoothly
      setTimeout(() => {
        element.scrollIntoView({ behavior: "smooth" });
      }, 100); // Delay helps in case layout isn't ready immediately
    }
  }
}, [location]);

  return (
    <>
      <div id="home" className="relative bg-[#b8d8ba] min-h-screen flex items-center">

       <div className="mt-10 mx-auto grid md:grid-cols-2 justify-items-center items-center transition-[gap] duration-100 ease-in-out"
  style={{ gap: "clamp(0.5rem, 2vw, 2rem)" }}>
        <div>
          <div className="space-y-4">
            <img
            src={hds}
            alt=""
            className="animate-slide-righ xl:ml-20 xl:mr-150 2xl:mr-230 md:scale-70"
            />
          </div>
        </div>
          <div className="max-w-xl mx-auto px-4 space-y-16">
          <div>
            <h2 className="xl:text-6xl opsa-text md:text-6xl text-4xl mb-10 font-extrabold text-gray-900 leading-relaxed">
            Do you want<br />
            to become a<br />
            member of<br />
            <span className="text-[#c9ff99]">CTHMC?</span>
            </h2>
            <Link to="/signup" className="mt-6 opsa-text px-15 xl:px-37 py-4 text-xl xl:text-2xl mb-40 md:mb-10 border-4 border-white text-white font-bold rounded-md hover:bg-white hover:text-[#a5b295] transition">
              Join Now
            </Link>

          </div>
         
        </div>
        </div>

      </div>

      <div id="about" className=" bg-white py-20 relative">
        <div className="max-w-6xl mx-auto grid xl:gap-70 gap-19 md:grid-cols-2 justify-items-center items-center">

          <div className="max-w-7xl mt-20 mx-auto px-3 space-y-5">
          <h2 className="text-4xl slab-text font-bold">ABOUT <span className="text-[#b1d8b7]">CTHMC</span></h2>
            <h2 className="text-2xl nopsa-text font-medium text-gray-900 leading-relaxed space-y-4">
              Welcome to <span className="font-extrabold">Carmona Townhomes</span><br />
              <span className="font-extrabold">Homeowners Multipurpose</span><br />
              Cooperative, a modern Financial <br />
              Management System that simplifies <br />
              cooperative and organizational<br />
              financial operations. Our objective<br />
              is to simplify financial monitoring,<br />
              increase transparency, and enable <br />
              organizations to easily manage their<br />
              members' shares and loans.<br />
            </h2>
        </div>

          <div className="md:mt-20 space-y-4">
            <img
          src={ads}
          alt=""
          className="animate-slide-right md:scale-120"
        />
          </div>
    </div>


        <div className="max-w-6xl mx-auto mt-30 px-4 space-y-16">
          <h2 className="text-5xl slab-text font-extrabold text-center">
            Why Choose <span className="text-[#b1d8b7]">CTHMC?</span>
          </h2>

          <div className="grid md:grid-cols-2 gap-49 mt-20">
            <div className="text-center space-y-">
              <h3 className="text-2xl opsa-text text-[#b1d8b7] font-extrabold">
                Automated Interest & Loan Management
              </h3>
              <p className="text-xl nopsa-text">
                No manual calculations, <br /> reducing errors.
              </p>
            </div>
            <div className="text-center space-y-">
              <h3 className="text-2xl opsa-text text-[#b1d8b7] font-extrabold">
                Real-Time Reports & Analytics
              </h3>
              <p className="text-xl nopsa-text">
                Instant access to financial <br /> statements and performance tracking.
              </p>
            </div>
            <div className="text-center space-y-">
              <h3 className="text-2xl opsa-text text-[#b1d8b7] font-extrabold">
                Secure & Transparent
              </h3>
              <p className="text-xl nopsa-text">
                Data encryption and audit logs <br /> for accountability.
              </p>
            </div>
            <div className="text-center space-y-">
              <h3 className="text-2xl opsa-text text-[#b1d8b7] font-extrabold">
                User-Friendly Interface
              </h3>
              <p className="text-xl nopsa-text">
                Easy navigation for members <br /> and administrators.
              </p>
            </div>
          </div>
        </div>
      </div>

<div id="contact" className="bg-[#b8d8ba] px-8 py-12 text-gray-800 mt-20">
  <div className="max-w-6xl mx-auto grid gap-12 md:grid-cols-2 items-center">

          <div>
            <h2 className="text-4xl opsa-text font-bold mb-4">Contact Us</h2>
            <p className="text-lg nopsa-text leading-relaxed">
              Have questions about financial management<br /> 
              Looking for a seamless solution to track shares<br /> 
              and loans? We’re here to help! <br /> 
              Contact us through any of the following.

            </p>
          </div>

          <div className="md:max-w-4xl md:mx-auto space-y-4">
            <div>
              <h3 className="font-bold opsa-text">Email</h3>
              <p>CTHMC@gmail.com</p>
            </div>
            <div>
              <h3 className="font-bold opsa-text">Contact No.</h3>
              <p>09123456789</p>
            </div>
          </div>
    </div>
</div>
      <div className="bg-black nopsa-text text-white text-center text-sm py-4 ">
          Copyright © CTHMC 2025. All Rights Reserved
      </div>
    </>
  );
}
