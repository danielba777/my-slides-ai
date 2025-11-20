import React from "react";

export const OutlineIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="24px"
    height="24px"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M4 5V7H10.5V19H12.5V7H19V5H4Z"
      stroke="black"
      strokeWidth="2"
      fill="white"
    />
  </svg>
);
