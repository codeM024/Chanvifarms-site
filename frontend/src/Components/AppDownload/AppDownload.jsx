import { useState } from "react";
import PropTypes from "prop-types";
import whytous from '../../assets/whyus.jpeg'
import Reveal from "../Motion/Reveal";
import "./AppDownload.css";

const steps = [
  { number: "01", title: "Farm-Fresh Quality", icon: "fa-leaf" },
  { number: "02", title: "Pre-order a day before", icon: "fa-calendar-check" },
  { number: "03", title: "Convenient Doorstep Delivery", icon: "fa-truck" },
  { number: "04", title: "Wide Variety of Choices", icon: "fa-apple-alt" },
  { number: "05", title: "Affordable Pricing", icon: "fa-tags" },
  { number: "06", title: "Free Delivery above 250Rs", icon: "fa-gift" },
];

const Step = ({ step, index }) => (
  <Reveal className="step-wrap" delay={Math.min((index % 3) * 0.08, 0.3)}>
    <div className="step">
      <div className="step-number">{step.number}</div>
      <div className="step-title">{step.title}</div>
      <i className={`fas ${step.icon} step-icon`} aria-hidden="true"></i>
    </div>
  </Reveal>
);

Step.propTypes = {
  step: PropTypes.shape({
    number: PropTypes.string,
    title: PropTypes.string,
    icon: PropTypes.string,
  }).isRequired,
  index: PropTypes.number.isRequired,
};

const WhyChooseUs = () => {
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <section className="why-choose-us" id="why-choose-us">
      <Reveal className="section-header">
        <span className="why-eyebrow">Why Chanvifarms</span>
        <h1>Why Choose Us?</h1>
      </Reveal>

      <div className="steps-container">
        <div className="steps-left">
          {steps.slice(0, 3).map((step, index) => (
            <Step key={step.number} step={step} index={index} />
          ))}
        </div>

        <Reveal className="why-choose-image" delay={0.1}>
          <div className={`why-choose-frame ${imgLoaded ? "" : "skeleton"}`}>
            <img
              src={whytous}
              alt="Why choose Chanvifarm"
              loading="lazy"
              decoding="async"
              className={`img-fade ${imgLoaded ? "is-loaded" : ""}`}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgLoaded(true)}
            />
          </div>
        </Reveal>

        <div className="steps-right">
          {steps.slice(3).map((step, index) => (
            <Step key={step.number} step={step} index={index + 3} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
