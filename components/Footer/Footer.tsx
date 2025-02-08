import { Linkedin, Github, Twitter } from "lucide-react";
import Link from "next/link";
import { Logo } from "../Logo/logo";

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-gray-200 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-between items-center mb-8">
          <div className="w-full flex flex-col items-start md:w-1/3 mb-4 md:mb-0">
            <Logo href="/" />
            <p className="mt-2 mr-4">
              Instantly convert PDFs, Docs, Sheets, and more to structured JSON with AI-powered precision. Define your schema, get perfect results - every time.
            </p>
          </div>
          <div className="w-full md:w-1/3 mb-4 md:mb-0">
            <h5 className="text-lg font-semibold">Quick Links</h5>
            <ul className="mt-2 space-y-2">
              <li>
                <Link href="/docs" className="hover:underline">
                  Documents
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:underline">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/terms_of_service_and_privacy_policy" className="hover:underline">
                  Terms of Service & Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
          <div className="w-full md:w-1/3">
            <h5 className="text-lg font-semibold">Contact Us</h5>
            <p className="mt-2">
              Email:{" "}
              <a
                href="mailto:aliamer19ali@gmail.com"
                className="hover:underline"
              >
                aliamer19ali@gmail.com
              </a>
            </p>
            <div className="mt-4 flex space-x-4">
              <a
                href="https://x.com/AliAmer12748774"
                target="_blank"
                className="transition-colors duration-300 hover:text-primary"
              >
                <Twitter />
              </a>
              <a
                href="https://linkedin.com/in/aliamer22"
                target="_blank"
                className="transition-colors duration-300 hover:text-primary"
              >
                <Linkedin />
              </a>

              <a
                href="https://github.com/aliamerj"
                target="_blank"
                className="transition-colors duration-300 hover:text-primary"
              >
                <Github />
              </a>
            </div>
          </div>
        </div>
        <div className="text-center border-t border-gray-700 pt-4">
          <p>&copy; 2025 Dcup. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
