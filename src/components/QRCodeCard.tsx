"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";

interface Props {
  businessName: string;
  slug: string;
}

export default function QRCodeCard({
  businessName,
  slug,
}: Props) {
  const [qrUrl, setQrUrl] = useState("");

  const reviewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/review/${slug}`;

  useEffect(() => {
    async function generateQR() {
      const url = await QRCode.toDataURL(reviewUrl);
      setQrUrl(url);
    }

    generateQR();
  }, [reviewUrl]);

  const downloadQR = () => {
    const link = document.createElement("a");
    link.href = qrUrl;
    link.download = `${slug}-qr.png`;
    link.click();
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-8 text-center shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        QR Code
      </h2>

      <p className="text-gray-600 text-sm mb-8">
        Print or share this QR code with customers
      </p>

      {qrUrl && (
        <div className="flex justify-center mb-8">
          <div className="bg-white border border-gray-200 p-4 rounded-lg">
            <img
              src={qrUrl}
              alt="QR Code"
              className="w-48 h-48"
            />
          </div>
        </div>
      )}

      <button
        onClick={downloadQR}
        className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-all"
      >
        Download QR Code
      </button>
    </div>
  );
}