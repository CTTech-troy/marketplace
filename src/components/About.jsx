import playLogo from "../assets/play-logo.png";
import securedLogo from "../assets/secured-logo.png";
import globalLogo from "../assets/global-logo.png";

function Feature({ icon, title, text }) {
  return (
    <div className="feature-card">
      <div className="feature-icon" aria-hidden>{icon}</div>
      <div>
        <h4 className="feature-title">{title}</h4>
        <p className="text">{text}</p>
      </div>
    </div>
  );
}

export default function About() {
  return (
    <section id="about" className="about container">
      <h2 className="section-title">
        About Us <span className="accent-script">CT STORE</span>
      </h2>

      <div className="about-grid">
        <div className="about-left">
          <h3 className="about-kicker">
            Introduction to the best <span className="accent">online market!</span>
          </h3>
        </div>

        <div className="about-mid">
          <p className="muted">
            CT Store is more than just a shopping platform; it’s a community-driven
            marketplace where shopping meets social engagement. Empowers anyone to
            buy, sell, or offer services in a fun and interactive way.
          </p>
        </div>

        <div className="about-right">
          <p className="muted">
            To create a decentralized, people-first marketplace where trust, creativity,
            and freedom define how trade happens. Whether you’re selling fashion, gadgets,
            or offering services like photography, tutoring, or baking.
          </p>
        </div>
      </div>

      <div className="features">
        <Feature
          icon={<img src={playLogo} alt="Engaging discovery" />}
          title="Engaging discovery"
          text="Explore products through dynamic, looping video feeds."
        />
        <Feature
          icon={<img src={securedLogo} alt="Engaging discovery" />}
          title="Private & Secure"
          text="Shop or sell with your real profile or completely anonymous."
        />
        <Feature
          icon={<img src={globalLogo} alt="Engaging discovery" />}
          title="Local & Global"
          text="Find sellers nearby or connect with anyone worldwide."
        />
      </div>
    </section>
  );
}
