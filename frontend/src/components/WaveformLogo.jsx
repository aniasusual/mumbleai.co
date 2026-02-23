/**
 * WaveformLogo — an SVG waveform that forms the letter M.
 * Used across landing page, sidebar, chat bubbles, and other pages.
 */

export const WaveformLogo = ({ size = 32, className = "" }) => {
  const s = size;
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      data-testid="waveform-logo"
    >
      <rect width="40" height="40" rx="10" fill="currentColor" fillOpacity="0.12" />
      {/* M-shaped waveform: 5 bars forming M silhouette */}
      <rect x="7" y="10" width="3" rx="1.5" height="20" fill="currentColor" opacity="0.9" />
      <rect x="13" y="16" width="3" rx="1.5" height="14" fill="currentColor" opacity="0.7" />
      <rect x="19" y="8" width="3" rx="1.5" height="24" fill="currentColor" opacity="1" />
      <rect x="25" y="16" width="3" rx="1.5" height="14" fill="currentColor" opacity="0.7" />
      <rect x="31" y="10" width="3" rx="1.5" height="20" fill="currentColor" opacity="0.9" />
    </svg>
  );
};

/** Smaller inline version for avatars in chat bubbles */
export const WaveformLogoSmall = ({ size = 20, className = "" }) => {
  const s = size;
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      data-testid="waveform-logo-small"
    >
      <rect x="7" y="10" width="3.5" rx="1.75" height="20" fill="currentColor" opacity="0.9" />
      <rect x="13.5" y="16" width="3.5" rx="1.75" height="14" fill="currentColor" opacity="0.7" />
      <rect x="19" y="8" width="3.5" rx="1.75" height="24" fill="currentColor" opacity="1" />
      <rect x="25" y="16" width="3.5" rx="1.75" height="14" fill="currentColor" opacity="0.7" />
      <rect x="31" y="10" width="3.5" rx="1.75" height="20" fill="currentColor" opacity="0.9" />
    </svg>
  );
};
