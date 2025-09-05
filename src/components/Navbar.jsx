import navlogo from '../assets/nav-logo.png';

export default function Navbar() {
  return (
    <header className="nav-wrap">
      <nav className="nav container">
        <div className="brand">
          <div className="brand-icon" aria-hidden>
            <img src={navlogo} alt="" />
          </div>
          <span className="brand-name">CT STORE</span>
        </div>

        <input id="nav-toggle" type="checkbox" />
        <label htmlFor="nav-toggle" className="hamburger" aria-label="Toggle menu">☰</label>

        <ul className="nav-links">
          <li><a href="#hero">Home</a></li>
          <li><a href="#about">About Us</a></li>
          <li><a href="#contact">Contact Us</a></li>
        </ul>

        <a className="btn primary" href="#hero">Start Exploring →</a>
      </nav>
    </header>
  );
}
