import { Link } from "react-router-dom";
import "./PrivacyPolicy.css";

export default function PrivacyPolicy() {
  return (
    <div className="policy-page">
      <header className="policy-header">
        <div className="policy-header__brand">
          <span className="policy-header__title">PEREZ</span>
          <span className="policy-header__subtitle">Printing Shop</span>
        </div>
        <Link to="/create-account" className="policy-back-link">
          ← Back
        </Link>
      </header>

      <main className="policy-content">
        <h1>Data Privacy Policy</h1>
        <p className="policy-updated">Last updated: August 2026</p>

        <p>
          Perez Printing Shop ("we," "our," or "us") respects your privacy
          and is committed to protecting the personal information you share
          with us. This Data Privacy Policy explains what information we
          collect, how we use it, and the choices you have.
        </p>

        <h2>1. Information We Collect</h2>
        <ul>
          <li>
            <strong>Account information:</strong> your email address and
            password when you create an account.
          </li>
          <li>
            <strong>Order information:</strong> details about print jobs you
            place, including files, quantities, and specifications.
          </li>
          <li>
            <strong>Payment information:</strong> transaction records for
            services rendered (payment processing itself is handled by our
            third-party payment provider — we do not store full card
            numbers).
          </li>
          <li>
            <strong>Contact information:</strong> phone number or address,
            if provided, for order pickup or delivery coordination.
          </li>
        </ul>

        <h2>2. How We Use Your Information</h2>
        <ul>
          <li>To create and manage your account.</li>
          <li>To process and fulfill your print orders.</li>
          <li>
            To send you notifications about your order status, payments, and
            shop announcements.
          </li>
          <li>To respond to inquiries and provide customer support.</li>
          <li>To improve our services and shop operations.</li>
        </ul>

        <h2>3. How We Protect Your Information</h2>
        <p>
          We use industry-standard security practices, including encrypted
          authentication through Firebase, to protect your account and
          personal data from unauthorized access, alteration, or disclosure.
        </p>

        <h2>4. Sharing of Information</h2>
        <p>
          We do not sell your personal information. We may share information
          with trusted third-party service providers (such as our payment
          processor or cloud hosting provider) solely to operate our
          services, and only to the extent necessary.
        </p>

        <h2>5. Your Rights</h2>
        <ul>
          <li>You may request access to the personal data we hold about you.</li>
          <li>You may request correction of inaccurate information.</li>
          <li>You may request deletion of your account and associated data, subject to legal or operational requirements.</li>
        </ul>

        <h2>6. Data Retention</h2>
        <p>
          We retain your personal information for as long as your account is
          active or as needed to provide you services, comply with legal
          obligations, resolve disputes, and enforce our agreements.
        </p>

        <h2>7. Changes to This Policy</h2>
        <p>
          We may update this Data Privacy Policy from time to time. Changes
          will be posted on this page with an updated "Last updated" date.
        </p>

        <h2>8. Contact Us</h2>
        <p>
          If you have questions about this policy or how your data is
          handled, please contact us through the Contacts page in your
          dashboard.
        </p>
      </main>
    </div>
  );
}