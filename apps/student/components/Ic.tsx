/* Icons + mascot — ported from window {Ic, Sunny, Avatar}.
   Stroke-based, friendly weight. Window-global → named ESM exports. */
import type { ReactNode, SVGProps } from "react";

export interface IcProps extends Omit<SVGProps<SVGSVGElement>, "stroke"> {
  size?: number;
  fill?: string;
  stroke?: string;
  sw?: number;
}

type IconComponent = (props?: IcProps) => ReactNode;

const mk = (paths: ReactNode): IconComponent => {
  const Icon = (props: IcProps = {}) => {
    const { size = 24, fill = "none", stroke = "currentColor", sw = 2, ...rest } = props;
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={fill}
        stroke={stroke}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...rest}
      >
        {paths}
      </svg>
    );
  };
  Icon.displayName = "Ic";
  return Icon;
};

export const Ic: Record<string, IconComponent> = {
  home: mk(<><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20h14V9.5" /><path d="M9.5 20v-5h5v5" /></>),
  books: mk(<><path d="M4 5a2 2 0 0 1 2-2h5v16H6a2 2 0 0 0-2 2z" /><path d="M20 5a2 2 0 0 0-2-2h-5v16h5a2 2 0 0 1 2 2z" /></>),
  chart: mk(<><path d="M4 20V5" /><path d="M4 20h16" /><rect x="7" y="12" width="3" height="5" rx="1" /><rect x="12" y="8" width="3" height="9" rx="1" /><rect x="17" y="14" width="3" height="3" rx="1" /></>),
  folder: mk(<><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></>),
  book: mk(<><path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z" /><path d="M18 3v16" /></>),
  ear: mk(<><path d="M7 9a5 5 0 0 1 10 0c0 2.5-2 3.5-3 5s-.5 3-2.5 3a2.5 2.5 0 0 1-2.5-2.5" /><path d="M9.5 9a2.5 2.5 0 0 1 4.5-1.5" /></>),
  pencil: mk(<><path d="M14 4l6 6" /><path d="M3 21l3.5-.8L19 7.5a2.1 2.1 0 0 0-3-3L3.8 17.2z" /></>),
  mic: mk(<><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0" /><path d="M12 18v3" /></>),
  zoom: mk(<><rect x="3" y="6" width="13" height="12" rx="3" /><path d="m16 10 5-3v10l-5-3z" /></>),
  play: mk(<path d="M7 4.5v15l13-7.5z" />),
  pause: mk(<><rect x="6" y="5" width="4" height="14" rx="1.3" /><rect x="14" y="5" width="4" height="14" rx="1.3" /></>),
  check: mk(<path d="M4 12.5l5 5L20 6.5" />),
  checkCircle: mk(<><circle cx="12" cy="12" r="9" /><path d="M8 12.3l2.6 2.6L16 9.5" /></>),
  lock: mk(<><rect x="5" y="10" width="14" height="10" rx="2.5" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>),
  clock: mk(<><circle cx="12" cy="12" r="9" /><path d="M12 7.5V12l3 2" /></>),
  arrowR: mk(<><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>),
  arrowL: mk(<><path d="M19 12H5" /><path d="m11 6-6 6 6 6" /></>),
  chevR: mk(<path d="m9 5 7 7-7 7" />),
  chevD: mk(<path d="m5 9 7 7 7-7" />),
  star: mk(<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />),
  coin: mk(<><circle cx="12" cy="12" r="9" /><path d="M12 7v10M9.5 9.5h4a1.8 1.8 0 0 1 0 3.5h-3a1.8 1.8 0 0 0 0 3.5h4" /></>),
  flame: mk(<path d="M12 3c1 3-2 4-2 7a2 2 0 0 0 4 0c2 1.5 3 3.5 3 5.5a5 5 0 0 1-10 0C7 12 12 9 12 3z" />),
  image: mk(<><rect x="3" y="4" width="18" height="16" rx="2.5" /><circle cx="8.5" cy="9.5" r="1.8" /><path d="m4 18 5-5 4 3 3-2 4 4" /></>),
  write: mk(<><path d="M5 20h14" /><path d="M14 4l6 6L9 21H3v-6z" /></>),
  dot: mk(<circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />),
  flag: mk(<><path d="M5 21V4" /><path d="M5 4h11l-2 4 2 4H5" /></>),
  gift: mk(<><rect x="4" y="9" width="16" height="11" rx="2" /><path d="M4 13h16M12 9v11" /><path d="M12 9S10 3 7.5 4.5 9.5 9 12 9zM12 9s2-6 4.5-4.5S14.5 9 12 9z" /></>),
  calendar: mk(<><rect x="4" y="5" width="16" height="16" rx="2.5" /><path d="M4 10h16M9 3v4M15 3v4" /></>),
  refresh: mk(<><path d="M20 7a8 8 0 1 0 1 6" /><path d="M20 3v4h-4" /></>),
  sparkle: mk(<><path d="M12 4l1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6z" /><path d="M18.5 16.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" /></>),
  eye: mk(<><path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z" /><circle cx="12" cy="12" r="2.6" /></>),
  wifi: mk(<><path d="M2 8.5a16 16 0 0 1 20 0" /><path d="M5 12a11 11 0 0 1 14 0" /><path d="M8.5 15.5a6 6 0 0 1 7 0" /><circle cx="12" cy="19" r="1.2" fill="currentColor" stroke="none" /></>),
  video: mk(<><rect x="3" y="6" width="13" height="12" rx="2.5" /><path d="m16 10 5-3v10l-5-3z" /></>),
  screen: mk(<><rect x="3" y="4" width="18" height="13" rx="2.5" /><path d="M8 21h8M12 17v4" /><path d="m9 11 3-3 3 3" /></>),
  spinner: mk(<><path d="M12 3v4" opacity=".9" /><path d="M12 17v4" opacity=".25" /><path d="M21 12h-4" opacity=".7" /><path d="M7 12H3" opacity=".4" /><path d="m18.4 5.6-2.8 2.8" opacity=".8" /><path d="m8.4 15.6-2.8 2.8" opacity=".3" /><path d="m18.4 18.4-2.8-2.8" opacity=".6" /><path d="m8.4 8.4-2.8-2.8" opacity=".5" /></>),
  x: mk(<><path d="M6 6l12 12M18 6 6 18" /></>),
  message: mk(<><path d="M4 5h16v11H8l-4 3z" /></>),
  clipboard: mk(<><rect x="5" y="4" width="14" height="17" rx="2.5" /><path d="M9 4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" /><path d="M8.5 11h7M8.5 15h5" /></>),
  target: mk(<><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" /></>),
  medal: mk(<><path d="M8 3h8l-2.2 6.2" /><path d="m8 3 2.2 6.2" /><circle cx="12" cy="15" r="6" /><path d="M12 12.4l1 2 2.2.3-1.6 1.5.4 2.2-2-1-2 1 .4-2.2-1.6-1.5 2.2-.3z" fill="currentColor" stroke="none" /></>),
  bolt: mk(<path d="M13 2 4 14h6l-1 8 9-12h-6z" />),
  dumbbell: mk(<><path d="M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.5 9v6M6.5 12h11" /></>),
};

// Brand resources (host injected window.__resources at runtime; here they are
// real files served from /public).
export const RESOURCES = {
  foxFace: "/fox.png",
  brandIcon: "/brand-icon.png",
};

// Mascot — "Finn" the fox (photo asset). Replaces the old SVG sun.
export function Sunny({ size = 56 }: { size?: number; mood?: string }) {
  return (
    <span className="fox-mascot" style={{ width: size, height: size }}>
      <img src={RESOURCES.foxFace} alt="Finn the fox" width={size} height={size} />
    </span>
  );
}

// Avatar
export function Avatar({ size = 40, name = "M" }: { size?: number; name?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40">
      <defs>
        <linearGradient id="av" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1A8C7D" />
          <stop offset="1" stopColor="#5EC4B8" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="999" fill="url(#av)" />
      <text x="20" y="28" textAnchor="middle" fontFamily="'DM Serif Display', serif" fontWeight="400" fontSize="19" fill="#fff">
        {name[0]}
      </text>
    </svg>
  );
}
