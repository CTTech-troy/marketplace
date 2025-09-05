import footer from "../assets/footer-logo.png";
import X from "../assets/x-logo.png";
import ig from "../assets/ig-logo.png";
import facebook from "../assets/acebook-logo.png";


export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="container footer-top">
        <div className="footer-brand">
          <div className="brand-icon" aria-hidden>
            <img src={footer} alt="" />
          </div>
          <div className="brand-name">CT STORE</div>
        </div>

        <div className="footer-cols">
          <div className="footer-col">
            <h4>Contact Us</h4>
            <ul>
              <li>support@gmail.com</li>
              <li>+234 916 555 2692</li>
              <li>Lagos, Nigeria</li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Connect</h4>
            <div className="socials">
            <ul className="socials-footer">
              
             <li><a href="#" aria-label="X / Twitter"> <img src={X} alt="" /></a></li>
             <li><a href="#" aria-label="Instagram"><img src={ig} alt="" /></a></li> 
             <li><a href="#" aria-label="Facebook"><img src={facebook} alt="" /></a></li> 
            </ul>
            </div>
          </div>

          <div className="footer-col footer-desc">
            <h4>About</h4>
            <p className="muted">
              CT Store is the next-gen social marketplace that merges the thrill of
              discovery with the ease of shopping. Connect with sellers, buy or sell
              products &amp; services, even anonymously.
            </p>
          </div>
        </div>
      </div>

      <div className="footer-newsletter">
        <div className="container newsletter-row">
          <p className="muted">Get great value and stay updated on everything</p>
          <form className="nl-form" onSubmit={(e)=>{e.preventDefault(); alert('Subscribed (demo)')}}>
            <input placeholder="Your Name" required />
            <input type="email" placeholder="Your mail address" required />
            <button className="btn outline" type="submit">Confirm</button>
          </form>
        </div>
      </div>

      <div className="container footer-bottom">
        <small>Copyright © {year} TamIane Technologies</small>
      </div>
    </footer>
  );
}
