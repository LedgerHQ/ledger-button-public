import { html } from "lit";

export const ClockIcon = html`
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
  >
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M1.5 8C1.5 4.40353 4.41018 1.5 8 1.5C11.5901 1.5 14.5 4.40986 14.5 8C14.5 11.5901 11.5901 14.5 8 14.5C4.40353 14.5 1.5 11.5898 1.5 8Z"
      fill="currentColor"
    />
    <path
      d="M11.1 8H8V4.26666"
      stroke="var(--background-base, #000)"
      stroke-width="1.3"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
`;

export default ClockIcon;
