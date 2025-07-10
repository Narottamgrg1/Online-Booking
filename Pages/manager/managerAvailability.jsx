import React, { useEffect, useState,useContext } from "react";
import ManagerNav from "../../../defaultPage/ManagerNav";
import MyCalendar from "../../../defaultPage/Calendar";
import apiRequest from "../../../lib/apiReq";
import AvailabilityGrid from "../../../defaultPage/AvailabilityGrid";
import moment from "moment-timezone";

import "./managerAvailability.css";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

function UpdateAvailability() {
    const { currentUser } = useContext(AuthContext);
    const [venue, setVenue] = useState(null);
    const [selectedSport, setSelectedSport] = useState("");
    const [selectedCourt, setSelectedCourt] = useState("");
    const [filteredCourts, setFilteredCourts] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);
    const [availability, setAvailability] = useState([]);
    const [availabilityUpdates, setAvailabilityUpdates] = useState([]);
    const [checkingAvailability, setCheckingAvailability] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
                if (currentUser.role!=="manager") {
                    navigate("/login");
                }
            }, [currentUser, navigate]);
    

    useEffect(() => {
        const venueData = JSON.parse(localStorage.getItem("venue_data"));
        if (venueData && venueData.id) {
            setVenue(venueData);
        } else {
            alert("Venue data not found. Please login again.");
        }
        setLoading(false);
    }, []);

    const handleSportChange = (sport) => {
        setSelectedSport(sport);
        setSelectedCourt(""); // Reset court when sport changes
        setAvailability([]);  // Clear availability when sport changes
        setAvailabilityUpdates([]);  // Clear availability updates when sport changes
        if (venue?.courts?.length) {
            const filtered = venue.courts.filter(court => court.sportname === sport);
            setFilteredCourts(filtered);
        }
    };

    const handleCourtChange = (courtId) => {
        setSelectedCourt(courtId);
        setAvailability([]);  // Clear availability when court changes
        setAvailabilityUpdates([]);  // Clear availability updates when court changes
    };

    const checkAvailability = async () => {
    if (!selectedSport || !selectedDate || !selectedCourt || !venue?.id) {
        alert("Please select a sport, court, and date.");
        return;
    }

    const nepalDate = moment(selectedDate).tz("Asia/Kathmandu").format("YYYY-MM-DD");

    setCheckingAvailability(true);

    try {
        const response = await apiRequest.post(`/availability/getavailabilitiesbybodyformanager/${venue.id}`, {
            date: nepalDate,
            sportname: selectedSport,
            courtId: selectedCourt,
        });

        const fetchedAvailability = response.data.availability;
        setAvailability(fetchedAvailability);
        setAvailabilityUpdates(fetchedAvailability); // Initially the same
    } catch (error) {
        setAvailability([]);
        setAvailabilityUpdates([]);
        alert(error.response?.data?.message || "Failed to fetch availability.");
    } finally {
        setCheckingAvailability(false);
    }
};


    const handleToggleAvailability = (slotId) => {
        const updated = availabilityUpdates.map(slot =>
            slot.id === slotId ? { ...slot, isAvailable: !slot.isAvailable } : slot
        );
        setAvailabilityUpdates(updated);
    };

    const handleUpdateAvailability = async () => {
        if (!venue?.id || !availabilityUpdates.length) {
            alert("No updates to submit.");
            return;
        }

        try {
            const response = await apiRequest.put(`/availability/updateavailabilities/${venue.id}`, {
                venueId: venue.id,
                updates: availabilityUpdates.map(slot => ({
                    id: slot.id,
                    isAvailable: slot.isAvailable,
                })),
            });

            alert("Availability updated successfully!");
            console.log("✅ Update Response:", response.data);
        } catch (error) {
            console.error("❌ Update Error:", error.response?.data || error.message);
            alert("Failed to update availability");
        }
    };

    if (loading) return <p>Loading venue details...</p>;
    if (error) return <p style={{ color: "red" }}>{error}</p>;

    return (
        <div className="manager-main-container">
            <ManagerNav />
            <div className="availability-container">
                <h2>Select a Sport</h2>
                <select
                    className="managersport-dropdown"
                    value={selectedSport}
                    onChange={(e) => handleSportChange(e.target.value)}
                >
                    <option value="" disabled>Select a sport</option>
                    {venue?.sports?.map((sport, index) => (
                        <option key={index} value={sport}>{sport}</option>
                    ))}
                </select>

                {selectedSport && (
                    <>
                        <h2>Select a Court</h2>
                        <select
                            className="managercourt-dropdown"
                            value={selectedCourt}
                            onChange={(e) => handleCourtChange(e.target.value)}
                        >
                            <option value="" disabled>Select a court</option>
                            {filteredCourts.length > 0 ? (
                                filteredCourts.map((court) => (
                                    <option key={court.id} value={court.id}>
                                        {court.title}
                                    </option>
                                ))
                            ) : (
                                <option disabled>No courts available</option>
                            )}
                        </select>
                    </>
                )}

                <div className="calendars-container">
                <h2>Select a Date</h2>
            <MyCalendar onDateSelect={(date) => setSelectedDate(date)} />
        </div>

                <button className="check-button" onClick={checkAvailability} disabled={!selectedSport || !selectedCourt || !selectedDate}>
                    Check Availability
                </button>

                {availability.length > 0 ? (
                    <div className="availability-grid">
                        <h3>Click a slot to toggle availability</h3>
                        <div className="grid">
                            {availabilityUpdates.map((slot) => (
                                <div
                                    key={slot.id}
                                    className={`slot ${slot.isAvailable ? "available" : "unavailable"}`}
                                    onClick={() => handleToggleAvailability(slot.id)}
                                >
                                    {slot.startTime} - {slot.endTime} <br />
                                    <span>{slot.isAvailable ? "✅ Available" : "❌ Not Available"}</span>
                                </div>
                            ))}
                        </div>
                        <button className="update-button"  onClick={handleUpdateAvailability} style={{ marginTop: "20px" }}>
                            Submit Availability Updates
                        </button>
                    </div>
                ) : checkingAvailability ? (
                    <p className="availability-p">Checking availability...</p>
                ) : (
                    <p className="availability-p">No availability found.</p>
                )}
            </div>
        </div>
    );
}

export default UpdateAvailability;
