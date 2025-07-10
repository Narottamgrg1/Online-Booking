import React from "react";
import "./ProgressBar.css";

const steps = ["Booking", "Confirmation", "Result"];

const ProgressBar = ({ currentStep }) => {
    const currentIndex = steps.indexOf(currentStep);

    return (
        <div className="progress-container">
            {steps.map((step, index) => (
                <div key={index} className={`step ${index <= currentIndex ? "active" : ""}`}>
                    <div className="circle">{index + 1}</div>
                    <span className="label">{step}</span>
                    {index < steps.length - 1 && <div className="line" />}
                </div>
            ))}
        </div>
    );
};

export default ProgressBar;
