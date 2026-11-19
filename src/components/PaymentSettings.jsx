import { useState, useEffect, useRef } from "react";
import {
  getPaymentSettings,
  savePaymentSettings,
  uploadPaymentQr,
} from "../services/paymentService";
import "./CustomerPayments.css";
import "./PaymentSettings.css";

export default function PaymentSettings() {
  const [loading, setLoading] = useState(true);
  const [accountName, setAccountName] = useState("");
  const [gcashNumber, setGcashNumber] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [qrFile, setQrFile] = useState(null);
  const [qrPreview, setQrPreview] = useState("");
  const previewRef = useRef("");
  const [fileInputKey, setFileInputKey] = useState(0);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ text: "", type: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getPaymentSettings()
      .then((settings) => {
        if (cancelled || !settings) return;
        setAccountName(settings.accountName || "");
        setGcashNumber(settings.gcashNumber || "");
        setQrUrl(settings.qrUrl || "");
      })
      .catch((err) => {
        console.error("Failed to load payment settings:", err);
        if (!cancelled) {
          setStatus({ text: "Failed to load payment settings.", type: "error" });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
  }, []);

  function handleFileChange(event) {
    const file = event.target.files?.[0] || null;
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = file ? URL.createObjectURL(file) : "";
    setQrPreview(previewRef.current);
    setQrFile(file);
    setErrors((previous) => ({ ...previous, qr: "" }));
  }

  function clearSelectedFile() {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = "";
    setQrPreview("");
    setQrFile(null);
    setFileInputKey((key) => key + 1);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus({ text: "", type: "" });

    const nextErrors = {};
    if (!accountName.trim()) nextErrors.accountName = "Enter the GCash account name.";
    if (!/^(\+?63|0)9\d{9}$/.test(gcashNumber.replace(/[\s-]/g, ""))) {
      nextErrors.gcashNumber = "Enter a valid GCash number (e.g. 09171234567).";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      const nextQrUrl = qrFile ? await uploadPaymentQr(qrFile) : qrUrl;
      await savePaymentSettings({ accountName, gcashNumber, qrUrl: nextQrUrl });
      setQrUrl(nextQrUrl);
      clearSelectedFile();
      setStatus({ text: "Payment details saved.", type: "success" });
    } catch (err) {
      console.error("Failed to save payment settings:", err);
      setStatus({
        text:
          err.code === "permission-denied"
            ? "Only an admin can change payment details."
            : err.message || "Failed to save payment details.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="dashboard-content">Loading payment settings...</div>;
  }

  const shownQr = qrPreview || qrUrl;

  return (
    <div className="dashboard-content cpay">
      <section className="cpay-card paysettings">
        <header className="cpay-card__header">
          <h3>GCash payment details</h3>
          <p>Customers see these details on their Payments page.</p>
        </header>

        {status.text && (
          <div className={`cpay-status cpay-status--${status.type}`} role="status">
            {status.text}
          </div>
        )}

        <form className="cpay-form" onSubmit={handleSubmit} noValidate>
          <div className="cpay-field">
            <label className="cpay-label" htmlFor="gcashName">Account name</label>
            <input
              id="gcashName"
              className="cpay-input"
              type="text"
              value={accountName}
              onChange={(event) => setAccountName(event.target.value)}
            />
            {errors.accountName && <span className="cpay-error">{errors.accountName}</span>}
          </div>

          <div className="cpay-field">
            <label className="cpay-label" htmlFor="gcashNumber">GCash number</label>
            <input
              id="gcashNumber"
              className="cpay-input"
              type="tel"
              inputMode="tel"
              placeholder="09XX XXX XXXX"
              value={gcashNumber}
              onChange={(event) => setGcashNumber(event.target.value)}
            />
            {errors.gcashNumber && <span className="cpay-error">{errors.gcashNumber}</span>}
          </div>

          <div className="cpay-field">
            <label className="cpay-label" htmlFor="gcashQr">QR code image</label>
            {shownQr && <img className="paysettings__qr" src={shownQr} alt="GCash QR code" />}
            <input
              key={fileInputKey}
              id="gcashQr"
              className="cpay-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
            />
            {errors.qr && <span className="cpay-error">{errors.qr}</span>}
          </div>

          <button type="submit" className="cpay-submit" disabled={saving}>
            {saving ? "Saving..." : "Save details"}
          </button>
        </form>
      </section>
    </div>
  );
}
