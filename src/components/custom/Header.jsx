import React, { useState } from "react";
import { Button } from "../ui/Button";
import logo from "../../assets/logo.png";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Create Trip', href: '/create-trip' },
    { name: 'Trip History', href: '/trip-History' },
    { name: 'Blog', href: '/blog' },
    { name: 'Deals', href: '/deals' }
  ];

  const isActive = (href) => location.pathname === href;

  return (
    <div className="h-16 shadow-sm flex justify-between items-center px-5 bg-white relative">
      {/* Logo - Left Side */}
      <Link
        to="/"
        className="flex items-center hover:opacity-80 transition-opacity"
      >
        <img
          src={logo}
          alt="Ghumo Logo"
          className="h-26 w-auto max-w-[200px] object-contain cursor-pointer"
        />
      </Link>

      {/* Desktop Navigation - Middle */}
      <nav className="hidden md:flex items-center space-x-8">
        {navigation.map((item) => (
         <Link
  key={item.name}
  to={item.href}
  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
    isActive(item.href)
      ? '!text-green-600 bg-green-50 font-semibold'
      : '!text-gray-700 hover:!text-green-600 hover:bg-gray-50'
  }`}
>
  {item.name}
</Link>

        ))}
      </nav>

      {/* Right Side - Sign In & Mobile Menu */}
      <div className="flex items-center gap-4">
        {/* Sign In Button */}
        <Button className="hidden sm:block">Sign In</Button>
        
        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden p-2 rounded-md text-gray-700 hover:text-green-600 hover:bg-gray-50 transition-colors"
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-white shadow-lg border-t md:hidden z-50">
          <nav className="py-4 px-5 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsMenuOpen(false)}
                className={`block px-3 py-3 rounded-md text-base font-medium transition-colors ${
                  isActive(item.href)
                    ? 'text-green-600 bg-green-50 font-semibold'
                    : 'text-gray-700 hover:text-green-600 hover:bg-gray-50'
                }`}
              >
                {item.name}
              </Link>
            ))}
            {/* Mobile Sign In */}
            <div className="pt-4 border-t border-gray-200 mt-4">
              <Button className="w-full">Sign In</Button>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}

export default Header;
