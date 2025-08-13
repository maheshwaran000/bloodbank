import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

// Blood Drop Icon
export const BloodDropIcon = ({ width, height, color }) => (
  <Svg
    width={width || 24}
    height={height || 24}
    viewBox="0 0 24 24"
    fill={color || "#AE2024"}
    xmlns="http://www.w3.org/2000/svg"
  >
    <Path d="M12 2C7.58 2 4 5.58 4 10c0 4.42 8 12 8 12s8-7.58 8-12c0-4.42-3.58-8-8-8z" />
  </Svg>
);

// Search Icon
export const SearchIcon = ({ width, height, color }) => (
  <Svg
    width={width || 24}
    height={height || 24}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color || "black"}
    strokeWidth={2}
    xmlns="http://www.w3.org/2000/svg"
  >
    <Circle cx="10" cy="10" r="7" />
    <Path d="M21 21l-6-6" />
  </Svg>
);

// User/Profile Icon
export const HomeIcon = ({ width, height, color }) => (
  <Svg
    width={width || 24}
    height={height || 24}
    viewBox="0 0 24 24"
    fill={color || "#000"}
    xmlns="http://www.w3.org/2000/svg"
  >
    <Path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z" />
  </Svg>
);

// Profile Filled Icon
export const ProfileIcon = ({ width, height, color }) => (
  <Svg
    width={width || 24}
    height={height || 24}
    viewBox="0 0 24 24"
    fill={color || "#000"}
    xmlns="http://www.w3.org/2000/svg"
  >
    <Circle cx="12" cy="8" r="4" />
    <Path d="M4 20c0-4 4-6 8-6s8 2 8 6v1H4v-1z" />
  </Svg>
);

// Request Filled Icon (plus inside a box)
export const RequestIcon = ({ width, height, color }) => (
  <Svg
    width={width || 24}
    height={height || 24}
    viewBox="0 0 24 24"
    fill={color || "#000"}
    xmlns="http://www.w3.org/2000/svg"
  >
    <Path d="M3 3h18v18H3V3zm9 4v4H8v2h4v4h2v-4h4v-2h-4V7h-2z" />
  </Svg>
);

export const BackArrowIcon = ({ width, height, color }) => (
  <Svg
    width={width || 24}
    height={height || 24}
    viewBox="0 0 24 24"
    fill={color || "#000"}
    xmlns="http://www.w3.org/2000/svg"
  >
    <Path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
  </Svg>
);

export const CallIcon = ({ width, height, color }) => (
  <Svg
    width={width || 24}
    height={height || 24}
    viewBox="0 0 24 24"
    fill={color || "#000"}
    xmlns="http://www.w3.org/2000/svg"
  >
    <Path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1C10.61 21 3 13.39 3 4c0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
  </Svg>
);

// WhatsApp Filled Icon
export const WhatsAppIcon = ({ width, height, color }) => (
  <Svg
    width={width || 24}
    height={height || 24}
    viewBox="0 0 24 24"
    fill={color || "#25D366"}
    xmlns="http://www.w3.org/2000/svg"
  >
    <Path d="M12.04 2.01c-5.52 0-10 4.48-10 10 0 1.77.46 3.5 1.34 5.03L2 22l5.15-1.34A9.96 9.96 0 0 0 12.04 22c5.52 0 10-4.48 10-10s-4.48-9.99-10-9.99zM12 20c-1.65 0-3.22-.44-4.6-1.28l-.33-.2-3.06.8.82-2.99-.21-.34A7.96 7.96 0 0 1 4 12c0-4.41 3.59-8 8-8 2.14 0 4.15.83 5.66 2.34A7.96 7.96 0 0 1 20 12c0 4.41-3.59 8-8 8zm4.35-5.65c-.24-.12-1.43-.7-1.65-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1.01-.37-1.93-1.17-.71-.63-1.19-1.41-1.33-1.65-.14-.24-.02-.38.1-.5.1-.1.24-.26.36-.4.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.48-.4-.42-.54-.43h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2 0 1.18.86 2.32.98 2.48.12.16 1.69 2.58 4.1 3.62.57.25 1.01.4 1.35.51.57.18 1.09.16 1.5.1.46-.07 1.43-.58 1.63-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28z" />
  </Svg>
);

export const CircleMediumIcon = ({ width, height, color, style }) => (
  <Svg
    width={width || 24}
    height={height || 24}
    viewBox="0 0 24 24"
    style={style}
    xmlns="http://www.w3.org/2000/svg"
  >
    <Circle
      cx="12"
      cy="12"
      r="4" // medium-sized circle in the middle
      fill={color || "#000"}
    />
  </Svg>
);

export const EditPenIcon = ({ width, height, color }) => (
  <Svg
    width={width || 24}
    height={height || 24}
    viewBox="0 0 24 24"
    fill={color || "#000"}
    xmlns="http://www.w3.org/2000/svg"
  >
    <Path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41L18.37 3.3a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.84z" />
  </Svg>
);

export const TickIcon = ({ width, height, color }) => (
  <Svg
    width={width || 24}
    height={height || 24}
    viewBox="0 0 24 24"
    fill={color || "#000"}
    xmlns="http://www.w3.org/2000/svg"
  >
    <Path d="M9 16.17l-3.88-3.88-1.41 1.41L9 19 21 7l-1.41-1.41z" />
  </Svg>
);

export const ShareIcon = ({ width, height, color }) => (
  <Svg
    width={width || 24}
    height={height || 24}
    viewBox="0 0 24 24"
    fill={color || "#000"}
    xmlns="http://www.w3.org/2000/svg"
  >
    <Path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7a3.12 3.12 0 0 0 0-1.39l7.02-4.11A2.99 2.99 0 1 0 14 5a3 3 0 0 0 .04.48L7.02 9.59a3 3 0 1 0 0 4.83l7.02 4.11c-.02.15-.04.31-.04.47a3 3 0 1 0 3-3z" />
  </Svg>
);

export const DeleteIcon = ({ width, height, color }) => (
  <Svg
    width={width || 24}
    height={height || 24}
    viewBox="0 0 24 24"
    fill={color || "#000"}
    xmlns="http://www.w3.org/2000/svg"
  >
    <Path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
  </Svg>
);

export const ChevronRightIcon = ({ width, height, color }) => {
  return (
    <Svg
      width={width || 24}
      height={height || 24}
      viewBox="0 0 24 24"
      fill="none"
    >
      <Path
        d="M9 6l6 6-6 6"
        stroke={color || "#000"}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const NotificationIcon = ({ width, height, color }) => {
  return (
    <Svg
      width={width || 24}
      height={height || 24}
      viewBox="0 0 24 24"
      fill="none"
    >
      <Path
        d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.17V11a6.002 6.002 0 0 0-4-5.659V5a2 2 0 1 0-4 0v.341A6.002 6.002 0 0 0 6 11v3.17a2 2 0 0 1-.6 1.43L4 17h5m6 0v1a3 3 0 1 1-6 0v-1h6z"
        stroke={color || "#000"}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};