"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import useSWR from "swr";

import { trackBookingCTA, trackDonationCTA } from "@/lib/ga-events";

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const toggleMobileMenu = () => setIsOpen((v) => !v);

  // Cloudinary site image (logo-main)
  const { data, isLoading } = useSWR(
    "/api/admin/site-images?key=logo-main",
    fetcher
  );

  const cloudLogo = data?.image?.imageUrl || "";
  const logoAlt = data?.image?.alt || "Mabel’s Pawfect Pet Services Logo";

  return (
    <>
      {/* Reserve space so fixed nav doesn't push content down (CLS fix) */}
      <div aria-hidden className="h-[72px] md:h-[80px]" />

      <nav
        id="site-nav"
        className="bg-white border-b shadow-md fixed top-0 w-full z-50"
      >
        <div className="max-w-screen-xl mx-auto flex items-center justify-between px-4 py-3 md:py-4">
          <Link href="/" className="flex items-center gap-2">
            {cloudLogo ? (
              <Image
                src={cloudLogo}
                alt={logoAlt}
                width={48}
                height={48}
                className="w-auto h-auto rounded-md"
                priority
              />
            ) : (
              // Placeholder prevents broken /_next/image requests and keeps layout stable
              <div
                aria-hidden
                className="w-[48px] h-[48px] rounded-md bg-pink-50 border border-pink-100"
              />
            )}

            <span className="text-lg font-bold text-pink-600">
              Mabel’s Pawfect Pet Services
            </span>

            {!cloudLogo && isLoading && (
              <span className="sr-only">Loading logo</span>
            )}
          </Link>

          {/* Desktop Nav Links (md and up) */}
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-700 font-medium">
            <Link href="/services" className="hover:text-pink-600">
              Services
            </Link>
            <Link href="/pricing-seasonal" className="hover:text-pink-600">
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
            <Link href="/blog" className="hover:text-pink-600">
              Blog
            </Link>
            <Link
              href="/donations"
              className="hover:text-pink-600"
              onClick={trackDonationCTA}
            >
              Donations
            </Link>
            <Link href="/about" className="hover:text-pink-600">
              About
            </Link>
            <Link
              href="/training-and-credentials"
              className="hover:text-pink-600"
            >
              Training &amp; Credentials
            </Link>
            <Link href="/contact" className="hover:text-pink-600">
              Contact
            </Link>
          </div>

          {/* Book Now CTA (desktop) */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/booking"
              className="text-white bg-pink-500 hover:bg-pink-600 font-medium rounded-lg text-sm px-5 py-2.5"
              onClick={trackBookingCTA}
            >
              Book Now
            </Link>
          </div>

          {/* Hamburger */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden h-10 w-10 grid place-items-center text-gray-600 hover:text-gray-900 focus:outline-none"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Drawer */}
        <div
          className={`md:hidden fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-[60] transform transition-transform duration-300 ${
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
                  trackBookingCTA();
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
              <Link href="/pricing-seasonal" onClick={toggleMobileMenu}>
                Pricing
              </Link>
            </li>

            <li>
              <Link href="/shop" onClick={toggleMobileMenu}>
                Shop
              </Link>
            </li>

            <li>
              <Link href="/blog" onClick={toggleMobileMenu}>
                Blog
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
                  trackDonationCTA();
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
                Training &amp; Credentials
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
                  trackBookingCTA();
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
            className="fixed inset-0 z-[55] bg-black/30"
            onClick={toggleMobileMenu}
          />
        )}
      </nav>
    </>
  );
}
