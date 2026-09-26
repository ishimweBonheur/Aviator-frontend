import { memo } from "react";
export const Aircraft = memo(function Aircraft() {
  return (
    <svg viewBox="0 0 130 75" aria-label="Altitude aircraft">
      <defs>
        <linearGradient id="plane" x2="0.5" y2="1">
          <stop stopColor="#ff647a" />
          <stop offset="1" stopColor="#f1244e" />
        </linearGradient>
      </defs>
      <path
        d="M9 43 40 35 59 7 72 5 65 31 109 25Q122 25 126 30L91 42 69 47 42 68 31 67 44 47 21 50Z"
        fill="url(#plane)"
      />
      <path d="m10 43-6-19 9-1 17 16m39-7 22-4-9 9-15 3" fill="#ff8b9c" />
      <path d="m40 44 50-9" stroke="#ffc3cb" strokeWidth="2" />
    </svg>
  );
});
