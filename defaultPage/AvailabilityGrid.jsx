import React from "react";
import "./AvailabilityGrid.css"; // Ensure you have this for styling

function AvailabilityGrid({ availability }) {
    return (
        <div className="availability-grid">
            <h3>Available Time Slots</h3>
            <div className="grid">
                {availability.length > 0 ? (
                    availability.map((slot) => (
                        <div
                            key={slot.id}
                            className={`time-slot ${slot.isAvailable ? "available" : "unavailable"}`}
                        >
                            {slot.startTime}:00 - {slot.endTime}:00
                        </div>
                    ))
                ) : (
                    <p>No availability found for this date and sport.</p>
                )}
            </div>
        </div>
    );
}

export default AvailabilityGrid;
