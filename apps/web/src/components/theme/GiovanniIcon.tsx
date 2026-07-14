import { useId } from "react";

export function GiovanniIcon({ className }: { className?: string }) {
    const id = useId();
    const paint0 = `${id}-paint0-radial`;
    const paint1 = `${id}-paint1-radial`;
    const paint2 = `${id}-paint2-linear`;
    const paint3 = `${id}-paint3-linear`;

    return (
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <path
                d="M23.4743 19.1971C24.5574 21.6453 22.1582 24.189 19.651 23.2507L3.79328 17.3166C1.73365 16.5458 1.16037 13.9036 2.71538 12.3486L11.8891 3.17487C13.3905 1.67348 15.9313 2.14748 16.7904 4.08923L23.4743 19.1971Z"
                fill={`url(#${paint0})`}
            />
            <path
                d="M23.4743 19.1971C24.5574 21.6453 22.1582 24.189 19.651 23.2507L3.79328 17.3166C1.73365 16.5458 1.16037 13.9036 2.71538 12.3486L11.8891 3.17487C13.3905 1.67348 15.9313 2.14748 16.7904 4.08923L23.4743 19.1971Z"
                fill={`url(#${paint1})`}
            />
            <path
                d="M23.4743 19.1971C24.5574 21.6453 22.1582 24.189 19.651 23.2507L3.79328 17.3166C1.73365 16.5458 1.16037 13.9036 2.71538 12.3486L11.8891 3.17487C13.3905 1.67348 15.9313 2.14748 16.7904 4.08923L23.4743 19.1971Z"
                fill={`url(#${paint2})`}
            />
            <path
                d="M23.4743 19.1971C24.5574 21.6453 22.1582 24.189 19.651 23.2507L3.79328 17.3166C1.73365 16.5458 1.16037 13.9036 2.71538 12.3486L11.8891 3.17487C13.3905 1.67348 15.9313 2.14748 16.7904 4.08923L23.4743 19.1971Z"
                fill={`url(#${paint3})`}
            />
            <path
                d="M23.4743 19.1971C24.5574 21.6453 22.1582 24.189 19.651 23.2507L3.79328 17.3166C1.73365 16.5458 1.16037 13.9036 2.71538 12.3486L11.8891 3.17487C13.3905 1.67348 15.9313 2.14748 16.7904 4.08923L23.4743 19.1971Z"
                fill="#EB5A3F"
                fillOpacity="0.2"
            />
            <path
                d="M23.4286 19.2172C24.4938 21.6248 22.1344 24.1263 19.6687 23.2036L3.81056 17.2699C1.78526 16.5118 1.22169 13.9136 2.75059 12.3843L11.9243 3.2106C13.4009 1.73405 15.8994 2.20005 16.7443 4.10968L23.4286 19.2172Z"
                stroke="#EB5A3F"
                strokeOpacity="0.25"
                strokeWidth="0.1"
            />
            <defs>
                <radialGradient
                    id={paint0}
                    cx="0"
                    cy="0"
                    r="1"
                    gradientUnits="userSpaceOnUse"
                    gradientTransform="translate(33.5505 18.6012) rotate(135) scale(4.41598 5.245)"
                >
                    <stop stopColor="#EB5A3F" stopOpacity="0.01" />
                    <stop offset="0.3" stopColor="#EB5A3F" stopOpacity="0.015" />
                    <stop offset="0.6" stopColor="#EB5A3F" stopOpacity="0.01" />
                    <stop offset="1" stopColor="#EB5A3F" stopOpacity="0" />
                </radialGradient>
                <radialGradient
                    id={paint1}
                    cx="0"
                    cy="0"
                    r="1"
                    gradientUnits="userSpaceOnUse"
                    gradientTransform="translate(28.1829 16.8366) rotate(135) scale(8.49227 10.0865)"
                >
                    <stop stopColor="#EB5A3F" stopOpacity="0.054" />
                    <stop offset="0.7" stopColor="#EB5A3F" stopOpacity="0.04" />
                    <stop offset="1" stopColor="#F0F0FF" stopOpacity="0" />
                </radialGradient>
                <linearGradient id={paint2} x1="5.65556" y1="23.4154" x2="29.0459" y2="22.2113" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#EB5A3F" stopOpacity="0.3" />
                    <stop offset="0.6" stopColor="#EB5A3F" stopOpacity="0" />
                    <stop offset="1" stopColor="#EB5A3F" stopOpacity="0.135" />
                </linearGradient>
                <linearGradient id={paint3} x1="7.20019" y1="7.86378" x2="25.7441" y2="26.4076" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#EB5A3F" stopOpacity="0.45" />
                    <stop offset="0.3" stopColor="#EB5A3F" stopOpacity="0.15" />
                    <stop offset="0.7" stopColor="#EB5A3F" stopOpacity="0" />
                    <stop offset="1" stopColor="#EB5A3F" stopOpacity="0.1125" />
                </linearGradient>
            </defs>
        </svg>
    );
}
