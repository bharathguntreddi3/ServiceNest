import React from "react";

export default function CheckoutStepper({ currentStep }) {
  const steps = ["Cart", "Address & Time", "Payment"];

  return (
    <div className="stepper-container" data-aos="fade-down">
      {steps.map((step, index) => {
        const stepNum = index + 1;
        const isActive = stepNum === currentStep;
        const isCompleted = stepNum < currentStep;

        return (
          <div
            key={index}
            className={`stepper-item ${isActive ? "active" : ""} ${
              isCompleted ? "completed" : ""
            }`}
          >
            <div className="step-wrapper">
              <div className="step-circle">{isCompleted ? "✓" : stepNum}</div>
              <div className="step-label">{step}</div>
            </div>
            {index < steps.length - 1 && <div className="step-line"></div>}
          </div>
        );
      })}
    </div>
  );
}