export default function ShelterMark({ className }) {
  return (
    <svg viewBox="0 0 30 26" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2 24C2 12.5 7.8 2 15 2C22.2 2 28 12.5 28 24"
        stroke="var(--teal)" strokeWidth="2.6" strokeLinecap="round"
      />
      <path
        d="M9 24C9 16.5 11.5 10 15 10C18.5 10 21 16.5 21 24"
        stroke="var(--gold)" strokeWidth="2.2" strokeLinecap="round"
      />
    </svg>
  );
}
