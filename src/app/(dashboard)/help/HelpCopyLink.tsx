"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function HelpCopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center gap-2">
      <code className="flex-1 rounded-md bg-white border border-blue-200 px-3 py-2 text-xs text-slate-700 truncate">
        {url}
      </code>
      <button
        onClick={copy}
        className="shrink-0 rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 flex items-center gap-1.5 transition-colors"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}
