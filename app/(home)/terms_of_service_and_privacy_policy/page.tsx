import React from 'react';
import { Check, X, Lock, Mail, Globe } from 'lucide-react';

const TermsPage: React.FC = () => {
  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-3xl bg-white p-8 shadow-lg rounded-lg">
        <header className="mb-10 border-b pb-4">
          <h1 className="text-3xl font-bold text-gray-800">
            Dcup Cloud – Terms of Service & Privacy Policy
          </h1>
        </header>

        {/* 1. Introduction */}
        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold text-gray-700">1. Introduction</h2>
          <p className="mb-4 text-gray-600">
            Welcome to Dcup Cloud! We provide a powerful, cloud-based service that helps you transform
            unstructured documents into clean, structured JSON. By using Dcup Cloud, you agree to the following
            Terms of Service and acknowledge our Privacy Policy.
          </p>
          <p className="text-gray-600">
            Your privacy and data security are our top priorities. We do not store your uploaded files or URLs.
            The only data we temporarily retain is the extracted result for caching purposes, which is automatically
            deleted after 24 hours.
          </p>
        </section>

        {/* 2. Terms of Service */}
        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold text-gray-700">2. Terms of Service</h2>

          {/* 2.1 Acceptable Use */}
          <div className="mb-6">
            <h3 className="mb-2 text-xl font-semibold text-gray-600">2.1 Acceptable Use</h3>
            <p className="mb-3 text-gray-600">
              By using Dcup Cloud, you agree to:
            </p>
            <ul className="space-y-2">
              <li className="flex items-center text-gray-600">
                <Check className="mr-2 h-5 w-5 text-green-500" /> Use the service only for lawful purposes.
              </li>
              <li className="flex items-center text-gray-600">
                <Check className="mr-2 h-5 w-5 text-green-500" /> Not attempt to exploit, reverse-engineer, or overload the system.
              </li>
              <li className="flex items-center text-gray-600">
                <Check className="mr-2 h-5 w-5 text-green-500" /> Respect API rate limits and fair usage policies.
              </li>
            </ul>
            <p className="mt-3 text-gray-600">
              We reserve the right to suspend or terminate accounts that violate these terms.
            </p>
          </div>

          {/* 2.2 Service Availability */}
          <div className="mb-6">
            <h3 className="mb-2 text-xl font-semibold text-gray-600">2.2 Service Availability</h3>
            <p className="text-gray-600">
              Dcup Cloud aims for high availability, but we do not guarantee uninterrupted service. Maintenance,
              security updates, or unforeseen issues may lead to temporary downtime. We will make reasonable efforts
              to notify users of planned maintenance.
            </p>
          </div>

          {/* 2.3 API Usage & Limits */}
          <div className="mb-6">
            <h3 className="mb-2 text-xl font-semibold text-gray-600">2.3 API Usage & Limits</h3>
            <p className="text-gray-600">
              Each user is assigned an API key, which must remain confidential. Misuse, sharing, or abuse of API
              access may result in account suspension.
            </p>
          </div>

          {/* 2.4 Liability Disclaimer */}
          <div>
            <h3 className="mb-2 text-xl font-semibold text-gray-600">2.4 Liability Disclaimer</h3>
            <p className="text-gray-600">
              Dcup Cloud processes data as provided by users. We do not validate, verify, or modify user-submitted
              content. We are not responsible for inaccuracies, lost data, or any damages resulting from the use of our
              service.
            </p>
          </div>
        </section>

        {/* 3. Privacy Policy */}
        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold text-gray-700">3. Privacy Policy</h2>

          {/* 3.1 Data We Collect */}
          <div className="mb-6">
            <h3 className="mb-2 text-xl font-semibold text-gray-600">3.1 Data We Collect</h3>
            <ul className="space-y-2">
              <li className="flex items-center text-gray-600">
                <Check className="mr-2 h-5 w-5 text-green-500" /> <strong>Account Data:</strong> Email, name, and login credentials.
              </li>
              <li className="flex items-center text-gray-600">
                <Check className="mr-2 h-5 w-5 text-green-500" /> <strong>API Usage Data:</strong> Request metadata (e.g., timestamps, API key usage) for monitoring fair usage and improving performance.
              </li>
              <li className="flex items-center text-gray-600">
                <Check className="mr-2 h-5 w-5 text-green-500" /> <strong>Processing Results:</strong> Extracted JSON results are cached for up to 24 hours to improve speed for repeated requests.
              </li>
            </ul>
          </div>

          {/* 3.2 Data We Do Not Store */}
          <div className="mb-6">
            <h3 className="mb-2 text-xl font-semibold text-gray-600">3.2 Data We Do Not Store</h3>
            <ul className="space-y-2">
              <li className="flex items-center text-gray-600">
                <X className="mr-2 h-5 w-5 text-red-500" /> We do <strong>NOT</strong> store your uploaded files, documents, or URLs.
              </li>
              <li className="flex items-center text-gray-600">
                <X className="mr-2 h-5 w-5 text-red-500" /> We do <strong>NOT</strong> permanently retain any input data after processing.
              </li>
              <li className="flex items-center text-gray-600">
                <X className="mr-2 h-5 w-5 text-red-500" /> We do <strong>NOT</strong> access or use your data beyond the requested transformation process.
              </li>
            </ul>
            <p className="mt-3 text-gray-600">
              Once processing is complete, the raw files are immediately discarded. The structured results are cached for 24 hours for efficiency and then permanently deleted.
            </p>
          </div>

          {/* 3.3 Security Measures */}
          <div className="mb-6">
            <h3 className="mb-2 text-xl font-semibold text-gray-600">3.3 Security Measures</h3>
            <ul className="space-y-2">
              <li className="flex items-center text-gray-600">
                <Lock className="mr-2 h-5 w-5 text-blue-500" /> End-to-end encryption for all file transfers.
              </li>
              <li className="flex items-center text-gray-600">
                <Lock className="mr-2 h-5 w-5 text-blue-500" /> Secure API authentication via Bearer Token (API Key).
              </li>
              <li className="flex items-center text-gray-600">
                <Lock className="mr-2 h-5 w-5 text-blue-500" /> Automatic deletion of cached data after 24 hours.
              </li>
            </ul>
          </div>

          {/* 3.4 Third-Party Services */}
          <div className="mb-6">
            <h3 className="mb-2 text-xl font-semibold text-gray-600">3.4 Third-Party Services</h3>
            <p className="text-gray-600">
              Dcup Cloud does not share, sell, or distribute your data to third parties. However, we may use third-party
              services for analytics, billing, or security monitoring (e.g., rate limit enforcement). These providers never have
              access to your uploaded documents.
            </p>
          </div>

          {/* 3.5 User Control & Data Deletion */}
          <div>
            <h3 className="mb-2 text-xl font-semibold text-gray-600">3.5 User Control & Data Deletion</h3>
            <ul className="space-y-2">
              <li className="flex items-center text-gray-600">
                <Check className="mr-2 h-5 w-5 text-green-500" /> Delete your account at any time, and all associated data will be removed.
              </li>
              <li className="flex items-center text-gray-600">
                <Check className="mr-2 h-5 w-5 text-green-500" /> Request manual deletion of processing results if you need immediate removal before the 24-hour expiration.
              </li>
            </ul>
          </div>
        </section>

        {/* 4. Changes to This Policy */}
        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold text-gray-700">4. Changes to This Policy</h2>
          <p className="text-gray-600">
            We may update these Terms and Privacy Policy from time to time. We will notify users via email or platform notifications
            if any significant changes occur. Continued use of Dcup Cloud after updates means you accept the revised terms.
          </p>
        </section>

        {/* 5. Contact Us */}
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-gray-700">5. Contact Us</h2>
          <p className="mb-2 text-gray-600 flex items-center">
            <Mail className="mr-2 h-5 w-5 text-indigo-500" /> <strong>Support Email: </strong> <a href="mailto:aliamer19ali@gmail.com" className="underline text-indigo-600 hover:text-indigo-800">aliamer19ali@gmail.com</a>
          </p>
          <p className="text-gray-600 flex items-center">
            <Globe className="mr-2 h-5 w-5 text-indigo-500" /> <strong>Website: </strong> <a href="https://www.dcup.dev" target="_blank" rel="noopener noreferrer" className="underline text-indigo-600 hover:text-indigo-800">dcup.dev</a>
          </p>
        </section>
      </div>
    </main>
  );
};

export default TermsPage;

