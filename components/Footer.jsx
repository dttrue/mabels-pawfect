// components/Footer.jsx

"use client";

import { Facebook, Instagram, Linkedin } from "lucide-react";
import Link from "next/link";
import { trackFooterLink } from "@/lib/ga-events"; // keep this

export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-pink-50 to-pink-100 border-t mt-10">
      <div className="max-w-screen-xl mx-auto px-4 py-8 text-center sm:text-left">
        {/* Top Row: Brand + Links */}
        <div className="sm:flex sm:items-center sm:justify-between">
          <div className="mb-4 sm:mb-0">
            <h2 className="text-lg font-semibold text-pink-600">
              Mabel’s Pawfect
            </h2>
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} All rights reserved.
            </p>
          </div>

          <div className="flex gap-4 justify-center text-sm">
            <Link
              href="/about"
              onClick={() =>
                trackFooterLink({ label: "about_cta", url: "/about" })
              }
              className="text-gray-600 hover:text-pink-600"
            >
              About
            </Link>

            <Link
              href="/contact"
              onClick={() =>
                trackFooterLink({ label: "contact_cta", url: "/contact" })
              }
              className="text-gray-600 hover:text-pink-600"
            >
              Contact
            </Link>

            {/* ✅ Add this */}
            <Link
              href="/disclosure"
              onClick={() =>
                trackFooterLink({
                  label: "affiliate_disclosure",
                  url: "/disclosure",
                })
              }
              className="text-gray-600 hover:text-pink-600"
            >
              Affiliate Disclosure
            </Link>
          </div>
        </div>

        <hr className="my-6 border-gray-200" />

        <div className="flex flex-col items-center gap-2 text-sm">
          <span className="text-gray-500 font-medium">Follow us:</span>
          <div className="flex gap-4">
            <a
              href="https://www.instagram.com/mabelspawfectpetservicesllc/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              onClick={() =>
                trackFooterLink({
                  label: "social_instagram",
                  url: "https://www.instagram.com/mabelspawfectpetservicesllc/",
                })
              }
              className="text-gray-600 hover:text-pink-500 transition-transform duration-200 hover:scale-110"
            >
              <Instagram className="w-5 h-5" />
            </a>

            <a
              href="https://www.linkedin.com/in/bridget-quinones-9ab17b286?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              onClick={() =>
                trackFooterLink({
                  label: "social_linkedin",
                  url: "https://www.linkedin.com/in/bridget-quinones-9ab17b286",
                })
              }
              className="text-gray-600 hover:text-pink-500 transition-transform duration-200 hover:scale-110"
            >
              <Linkedin className="w-5 h-5" />
            </a>

            <a
              href="https://www.facebook.com/share/167cnHCnmV/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              onClick={() =>
                trackFooterLink({
                  label: "social_facebook",
                  url: "https://www.facebook.com/share/167cnHCnmV/",
                })
              }
              className="text-gray-600 hover:text-pink-500 transition-transform duration-200 hover:scale-110"
            >
              <Facebook className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Optional: tiny always-on disclosure line (not required, but safe) */}
        {/* 
        <p className="mt-6 text-xs text-gray-500 text-center">
          Some links may be affiliate links. As an Amazon Associate, we earn from qualifying purchases.
        </p> 
        */}
      </div>
    </footer>
  );
}
