"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";

interface Props {
  businessName: string;
  slug: string;
}

export default function QRCodeCard({ businessName, slug }: Props) {
  const [qrUrl, setQrUrl] = useState("");
  const reviewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/review/${slug}`;

  useEffect(() => {
    QRCode.toDataURL(reviewUrl).then(setQrUrl).catch(() => {});
  }, [reviewUrl]);

  const downloadQR = () => {
    const link = document.createElement("a");
    link.href = qrUrl;
    link.download = `${slug}-qr.png`;
    link.click();
  };

  return (
    <div style={{
      background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
      padding: "20px 16px", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      width: "100%", boxSizing: "border-box", overflow: "hidden",
    }}>
      <h2 style={{ fontSize: 15, fontWeight: 600, color: "#111827", marginBottom: 6 }}>
        QR Code
      </h2>
      <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
        Print or share this QR code with customers
      </p>

      {qrUrl && (
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", padding: 12, borderRadius: 10, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <img
              src={qrUrl}
              alt={`QR code for ${businessName}`}
              style={{ width: 160, height: 160, display: "block", maxWidth: "100%" }}
            />
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "center" }}>
        <button
          onClick={downloadQR}
          disabled={!qrUrl}
          style={{
            padding: "10px 24px", background: "#111827", color: "#fff",
            border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500,
            cursor: qrUrl ? "pointer" : "not-allowed", opacity: qrUrl ? 1 : 0.5,
            transition: "background 0.2s",
          }}
        >
          Download QR Code
        </button>
      </div>
    </div>
  );
}
