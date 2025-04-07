import { Facebook, Instagram, Linkedin } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-pink-50 to-pink-100 border-t mt-10">
      <div className="max-w-screen-xl mx-auto px-4 py-8 text-center sm:text-left">
        {/* Top Row: Brand + Links */}
        <div className="sm:flex sm:items-center sm:justify-between">
          {/* Left side */}
          <div className="mb-4 sm:mb-0">
            <h2 className="text-lg font-semibold text-pink-600">
              Mabel’s Pawfect
            </h2>
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} All rights reserved.
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-4 justify-center text-sm">
            <Link href="/about" className="text-gray-600 hover:text-pink-600">
              About
            </Link>
            <Link href="/contact" className="text-gray-600 hover:text-pink-600">
              Contact
            </Link>
          </div>
        </div>

        {/* Divider */}
        <hr className="my-6 border-gray-200" />

        {/* Socials Section */}
        <div className="flex flex-col items-center gap-2 text-sm">
          <span className="text-gray-500 font-medium">Follow us:</span>
          <div className="flex gap-4">
            <a
              href="https://www.instagram.com/mabelspawfectpetservices?igsh=MWs1anNyYzM4ZGt5cA=="
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="text-gray-600 hover:text-pink-500 transition-transform duration-200 hover:scale-110"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a
              href="https://www.linkedin.com/in/bridget-quinones-9ab17b286?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="text-gray-600 hover:text-pink-500 transition-transform duration-200 hover:scale-110"
            >
              <Linkedin className="w-5 h-5" />
            </a>
            <a
              href="https://www.facebook.com/share/167cnHCnmV/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="text-gray-600 hover:text-pink-500 transition-transform duration-200 hover:scale-110"
            >
              <Facebook className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
