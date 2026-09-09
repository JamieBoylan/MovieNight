"use client";

import { useState } from "react";

export default function CopyLinkButton({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      const url = `${window.location.origin}${path}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API can be blocked (e.g. no HTTPS/permissions) — fail quietly.
    }
  }

  return (
    <button type="button" onClick={copy} className="btn-secondary btn-sm">
      {copied ? "Copied! ✅" : "🔗 Copy invite link"}
    </button>
  );
}
