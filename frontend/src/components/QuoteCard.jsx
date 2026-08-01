// frontend/src/components/QuoteCard.jsx
export default function QuoteCard({ quote }) {
  if (!quote) return null;
  return (
    <div className="quote-card">
      <div className="quote-text">{quote.text}</div>
      <div className="quote-author">— {quote.author}</div>
    </div>
  );
}