import React from "react";
import { Button } from "../ui/Button";
import { Link } from "react-router-dom";

function Hero() {
  return (
    <div className="flex flex-col items-center mx-56 gap-9 mt-16">
      <h1 className="font-extrabold text-[50px] text-center ">
        <span className="text-[#f56551]">Bas Ghumo, Baaki AI Dekh Lega</span>{" "}
        Seamless Solutions for Smart Travelers
      </h1>
      <p className="text-xl text-gray-500 text-center">Your Budget. Your Mood. Your Trip—Powered by Ghumo.</p>
      <Link to={'/create-trip'}><Button>Get started,it's Free</Button></Link>
      
    </div>
  );
}

export default Hero;
