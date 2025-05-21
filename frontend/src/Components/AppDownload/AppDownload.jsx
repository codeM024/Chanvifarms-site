import { useEffect } from "react";
import whytous from '../../assets/whyus.jpeg'
import "./AppDownload.css";

const WhyChooseUs = () => {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("step-visible");
          }
        });
      },
      { threshold: 0.3 }
    );

    document.querySelectorAll(".step, .cta-box").forEach((element) => {
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const steps = [
    { number: "01", title: "Farm-Fresh Quality" },
    { number: "02", title: "Pre-order a day before" },
    { number: "03", title: "Convenient Doorstep Delivery" },
    { number: "04", title: "Wide Variety of Choices" },
    { number: "05", title: "Affordable Pricing" },
    { number: "06", title: "Free Delivery above 250Rs" },
  ];

  return (
    <>
      <div className="why-choose-us" id="why-choose-us">
        <div className="section-header">
          <h1>Why Chanvifarm</h1>
          <h2>Why Choose Us?</h2>
        </div>

        <div className="steps-container">
          <div className="steps-left">
            {steps.slice(0, 3).map((step, index) => (
              <div key={index} className="step">
                <div className="step-number">{step.number}</div>
                <div className="step-title">{step.title}</div>
              </div>
            ))}
          </div>

          <div className="why-choose-image">
            <img src={whytous} alt="Why choose Chanvifarm" />
          </div>

          <div className="steps-right">
            {steps.slice(3).map((step, index) => (
              <div key={index + 3} className="step">
                <div className="step-number">{step.number}</div>
                <div className="step-title">{step.title}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default WhyChooseUs;
