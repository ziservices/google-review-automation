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
    <div className="bg-white rounded-2xl shadow-lg p-8 text-center">

      <h2 className="text-2xl font-bold mb-2">
        {businessName}
      </h2>

      <p className="text-gray-500 mb-6">
        Scan to leave a review
      </p>

      {qrUrl && (
        <img
          src={qrUrl}
          alt="QR Code"
          className="w-64 h-64 mx-auto mb-6"
        />
      )}

      <button
        onClick={downloadQR}
        className="bg-black text-white px-6 py-3 rounded-xl"
      >
        Download QR
      </button>

    </div>
  );
}