import React from "react";

export function TikTokIcon({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className || "h-5 w-5 text-slate-900"}
      aria-hidden="true"
      {...props}
    >
      <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-2.896 2.896 2.896 2.896 0 0 1-2.896-2.896 2.896 2.896 0 0 1 2.896-2.896c.306 0 .598.05.87.14v-3.52a6.315 6.315 0 0 0-.87-.06 6.337 6.337 0 0 0-6.337 6.337 6.337 6.337 0 0 0 6.337 6.337 6.337 6.337 0 0 0 6.337-6.337V9.332a8.212 8.212 0 0 0 4.774 1.524V7.41a4.814 4.814 0 0 1-1.001-.724z" />
    </svg>
  );
}
