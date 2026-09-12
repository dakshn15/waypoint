import React from "react";

interface VerifiedBadgeProps {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  color?: string; // Hex or CSS color for the rosette seal
  showLabel?: boolean;
  label?: string;
  title?: string;
}

export function VerifiedBadge({
  size = "sm",
  className = "",
  color = "#1463eb", // Upwork authentic royal blue verified color
  showLabel = false,
  label = "Verified",
  title = "Verified by Waypoint Admin (Identity & Business License Confirmed)",
}: VerifiedBadgeProps) {
  const sizeMap = {
    xs: "h-3.5 w-3.5",
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const badgeIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      aria-hidden="true"
      viewBox="0 0 24 24"
      role="img"
      className={`${sizeMap[size]} shrink-0 inline-block align-middle transition-transform hover:scale-110`}
      style={{ "--icon-color": color, "--icon-color-bg": "#ffffff" } as React.CSSProperties}
    >
      <title>{title}</title>
      {/* Scalloped rosette seal fill */}
      <path
        fill="var(--icon-color, #1463eb)"
        fillRule="evenodd"
        vectorEffect="non-scaling-stroke"
        stroke="var(--icon-color, #1463eb)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeMiterlimit="10"
        strokeWidth="1.5"
        d="M20.4 13.1c.8 1 .3 2.5-.9 2.9-.8.2-1.3 1-1.3 1.8 0 1.3-1.2 2.2-2.5 1.8-.8-.3-1.7 0-2.1.7-.7 1.1-2.3 1.1-3 0-.5-.7-1.3-1-2.1-.7-1.4.4-2.6-.6-2.6-1.8 0-.8-.5-1.6-1.3-1.8-1.2-.4-1.7-1.8-.9-2.9.5-.7.5-1.6 0-2.2-.9-1-.4-2.5.9-2.9.8-.2 1.3-1 1.3-1.8C5.9 5 7.1 4 8.3 4.5c.8.3 1.7 0 2.1-.7.7-1.1 2.3-1.1 3 0 .5.7 1.3 1 2.1.7 1.4-.5 2.6.5 2.6 1.7 0 .8.5 1.6 1.3 1.8 1.2.4 1.7 1.8.9 2.9-.4.6-.4 1.6.1 2.2z"
        clipRule="evenodd"
      />
      {/* Centered white checkmark */}
      <path
        vectorEffect="non-scaling-stroke"
        stroke="var(--icon-color-bg, #ffffff)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeMiterlimit="10"
        strokeWidth="1.75"
        d="M15.5 9.7L11 14.3l-2.5-2.5"
      />
    </svg>
  );

  if (showLabel) {
    return (
      <span
        title={title}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-[11px] font-bold text-blue-700 shadow-xs ${className}`}
      >
        {badgeIcon}
        <span>{label}</span>
      </span>
    );
  }

  return (
    <span title={title} className={`inline-flex items-center cursor-help ${className}`}>
      {badgeIcon}
    </span>
  );
}
