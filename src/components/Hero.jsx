import robot from '../assets/rocket-logo.png';


export default function Hero() {
  return (
    <section id="hero" className="hero container">
      <div className="badge">
        <span className="badge-icon" aria-hidden>
            <img src={robot} alt="" />
        </span>
        <span>#1 Market place platform</span>
      </div>

      <h1 className="hero-title">
        Shop, Sell, Connect<br />
        All In <span className="accent-script">One Place</span>
      </h1>

      <p className="hero-sub">
        Next-gen social marketplace that merges the thrill of discovery with the ease
        of shopping. Scroll through short videos, connect with sellers, buy or sell
        products &amp; services, all on your own terms, even anonymously.
      </p>

      <div className="hero-media" aria-label="Promo image/video placeholder" />
    </section>
  );
}
