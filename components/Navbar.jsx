"use client";
import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMobileMenu = () => setIsOpen(!isOpen);

  return (
    <nav className="bg-white border-b shadow-md fixed top-0 w-full z-50">
      <div className="max-w-screen-xl mx-auto flex items-center justify-between px-4 py-3 md:py-4">
        {/* Logo */}
        <Link
          href="/"
          className="text-2xl font-bold text-pink-600 flex items-center gap-2"
        >
          🐾 Mabel’s Pawfect
        </Link>

        {/* Book Now CTA (desktop) */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/booking"
            className="text-white bg-pink-500 hover:bg-pink-600 font-medium rounded-lg text-sm px-5 py-2.5"
          >
            Book Now
          </Link>
        </div>

        {/* Hamburger */}
        <button
          onClick={toggleMobileMenu}
          className="md:hidden text-gray-600 hover:text-gray-900 focus:outline-none"
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      <div
        className={`md:hidden fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-40 transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b">
          <span className="text-lg font-bold text-pink-600">Menu</span>
          <button
            onClick={toggleMobileMenu}
            className="text-gray-500 hover:text-gray-900"
            aria-label="Close menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <ul className="flex flex-col gap-4 p-4 text-gray-700">
          <li>
            <Link href="/" onClick={toggleMobileMenu}>
              Home
            </Link>
          </li>
          <li>
            <Link href="/booking" onClick={toggleMobileMenu}>
              Book
            </Link>
          </li>
          <li>
            <Link href="/services" onClick={toggleMobileMenu}>
              Services
            </Link>
          </li>
          <li>
            <Link href="/gallery" onClick={toggleMobileMenu}>
              Gallery
            </Link>
          </li>
          <li>
            <Link href="/reviews" onClick={toggleMobileMenu}>
              Reviews
            </Link>
          </li>
          <li>
            <Link
              href="/booking"
              onClick={toggleMobileMenu}
              className="block mt-6 text-white bg-pink-500 hover:bg-pink-600 font-medium rounded-lg text-center px-4 py-2.5"
            >
              Book Now
            </Link>
          </li>
        </ul>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black opacity-30"
          onClick={toggleMobileMenu}
        />
      )}
    </nav>
  );
}
