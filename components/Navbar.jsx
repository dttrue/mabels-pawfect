"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import useSWR from "swr";

import MemberProfile from "./dashboard/MemberProfile";
import { trackBookingCTA, trackDonationCTA } from "@/lib/ga-events";

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const toggleMobileMenu = () => setIsOpen(!isOpen);

  // 🔥 Fetch logo-main from Cloudinary (if uploaded)
  const { data } = useSWR("/api/admin/site-images?key=logo-main", fetcher);
  const cloudLogo = data?.image?.imageUrl || null;

  // 🔥 Fallback to your local logo until Cloudinary version is uploaded
  const logoSrc = cloudLogo || "/images/christmas_logo_2025.png";
  const logoAlt = data?.image?.alt || "Mabel’s Pawfect Pet Services Logo";

  return (
    <>
      <nav
        id="site-nav"
        className="bg-white border-b shadow-md fixed top-0 w-full z-50"
      >
        <div className="max-w-screen-xl mx-auto flex items-center justify-between px-4 py-3 md:py-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src={logoSrc}
              alt={logoAlt}
              width={48}
              height={48}
              className="w-auto h-auto rounded-md"
              priority
            />

            <span className="text-lg font-bold text-pink-600 ">
              Mabel’s Pawfect Pet Services
            </span>
          </Link>

          {/* Desktop Nav Links (md and up) */}
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-700 font-medium">
            <Link href="/services" className="hover:text-pink-600">
              Services
            </Link>
            <Link href="/pricing" className="hover:text-pink-600">
              Pricing
            </Link>
            <Link href="/gallery" className="hover:text-pink-600">
              Gallery
            </Link>
            <Link href="/reviews" className="hover:text-pink-600">
              Reviews
            </Link>
            <Link href="/shop" className="hover:text-pink-600">
              Shop
            </Link>
            <Link
              href="/donations"
              className="hover:text-pink-600"
              onClick={trackDonationCTA} // ✅ donation CTA
            >
              Donations
            </Link>
            <Link href="/about" className="hover:text-pink-600">
              About
            </Link>
            <Link href="/training-and-credentials">Training & Credentials</Link>
            <Link href="/contact" className="hover:text-pink-600">
              Contact
            </Link>
          </div>

          {/* Book Now CTA (desktop) */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/booking"
              className="text-white bg-pink-500 hover:bg-pink-600 font-medium rounded-lg text-sm px-5 py-2.5"
              onClick={trackBookingCTA} // ✅ booking CTA
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
              <Link
                href="/booking"
                onClick={() => {
                  trackBookingCTA(); // ✅ mobile Book event
                  toggleMobileMenu();
                }}
              >
                Book
              </Link>
            </li>
            <li>
              <Link href="/services" onClick={toggleMobileMenu}>
                Services
              </Link>
            </li>
            <li>
              <Link href="/pricing" onClick={toggleMobileMenu}>
                Pricing
              </Link>
            </li>
            <li>
              <Link href="/shop" onClick={toggleMobileMenu}>
                Shop
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
                href="/donations"
                onClick={() => {
                  trackDonationCTA(); // ✅ mobile Donation event
                  toggleMobileMenu();
                }}
              >
                Donations
              </Link>
            </li>
            <li>
              <Link href="/about" onClick={toggleMobileMenu}>
                About
              </Link>
            </li>
            <li>
              <Link href="/training-and-credentials" onClick={toggleMobileMenu}>
                Training & Credentials
              </Link>
            </li>
            <li>
              <Link href="/contact" onClick={toggleMobileMenu}>
                Contact
              </Link>
            </li>
            <li>
              <Link
                href="/booking"
                onClick={() => {
                  trackBookingCTA(); // ✅ mobile Book Now button
                  toggleMobileMenu();
                }}
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
      {/* <MemberProfile /> */}
    </>
  );
}
