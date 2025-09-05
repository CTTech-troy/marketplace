import hotline from "../assets/hotline-logo.png";
import message from "../assets/message-logo.png";
import email from "../assets/email-logo.png";
import X from "../assets/x-logo.png";
import ig from "../assets/ig-logo.png";
import facebook from "../assets/acebook-logo.png";

export default function Contact() {
  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Message sent (demo). Wire up your API here.");
  };

  return (
    <section id="contact" className="contact container">
      <h2 className="section-title">
        Contact <span className="accent-script">US</span>
      </h2>

      <div className="contact-card">
        <form className="contact-left" onSubmit={handleSubmit}>
          <h3 className="contact-heading muted">We’d love To Hear From You</h3>
          <p className="text">Got questions, feedback, or partnership inquiries? Let’s connect.</p>

          <div className="grid-2">
            <div>
              <label>First Name</label>
              <input placeholder="Enter your first name" required />
            </div>
            <div>
              <label>Last Name</label>
              <input placeholder="Enter your last name" required />
            </div>
          </div>

          <div className="grid-2">
            <div>
              <label>Email</label>
              <input type="email" placeholder="Enter your email" required className="muted"/>
            </div>
            <div>
              <label>Contact details</label>
              <input placeholder="+234 | Enter your contact details" />
            </div>
          </div>

          <div>
            <label>Send Message</label>
            <textarea rows="4" placeholder="Enter your first message" />
          </div>

          <button className="btn primary" type="submit">Send Message →</button>
        </form>

        <aside className="contact-right">
          <p className="contact-help">Hi! We are always here to help you.</p>

          <div className="contact-list">
            <div className="contact-item">
              <span className="ci-icon" aria-hidden>
                <img src={hotline} alt="" />
              </span>
              <div>
                <div className="ci-title">Hotline:</div>
                <div className="ci-text">+2349030998282</div>
              </div>
            </div>

            <div className="contact-item">
              <span className="ci-icon" aria-hidden>
                <img src={message} alt="" />
              </span>
              <div>
                <div className="ci-title">SMS / Messages:</div>
                <div className="ci-text">+2349030998282</div>
              </div>
            </div>

            <div className="contact-item">
              <span className="ci-icon" aria-hidden>
                <img src={email} alt="" />
              </span>
              <div>
                <div className="ci-title">Email:</div>
                <div className="ci-text">support@gmail.com</div>
              </div>
            </div>
          </div>

          <div className="socials">
            <a href="#" aria-label="X / Twitter"> <img src={X} alt="" /></a>
            <a href="#" aria-label="Instagram"><img src={ig} alt="" /></a>
            <a href="#" aria-label="Facebook"><img src={facebook} alt="" /></a>
          </div>
        </aside>
      </div>
    </section>
  );
}
