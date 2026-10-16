export default function Loading() {
  return <section className="section-block" aria-busy="true" aria-live="polite">
    <p className="eyebrow">LOADING THE COLLECTION</p>
    <div className="section-heading"><h1>Just a moment.</h1></div>
    <div className="product-grid loading-grid">
      {Array.from({ length: 8 }, (_, index) => <div className="product-skeleton" key={index}>
        <div className="skeleton-image" /><div className="skeleton-line" /><div className="skeleton-line skeleton-line-short" /><div className="skeleton-button" />
      </div>)}
    </div>
  </section>;
}