import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import MyCalendar from "./Calendar";
import apiRequest from "../lib/apiReq";
import AvailabilityGrid from "./AvailabilityGrid";
import "./Availability.css";

function Availability() {
    const { id } = useParams();
    const [venue, setVenue] = useState(null);
    const [selectedSport, setSelectedSport] = useState("");
    const [filteredCourts, setFilteredCourts] = useState([]);
    const [selectedCourt, setSelectedCourt] = useState("");
    const [selectedDate, setSelectedDate] = useState(null);
    const [availability, setAvailability] = useState([]);
    const [checkingAvailability, setCheckingAvailability] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hasCheckedAvailability, setHasCheckedAvailability] = useState(false); // Track if availability has been checked

    useEffect(() => {
        const fetchVenueData = async () => {
            try {
                const response = await apiRequest.get(`/venue/getvenue/${id}`);
                setVenue(response.data);
            } catch (error) {
                setError(error.response?.data?.message || "Failed to fetch venue details.");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchVenueData();
        }
    }, [id]);

    const handleSportChange = (sport) => {
        setSelectedSport(sport);
        setSelectedCourt(""); // Reset the selected court when the sport changes
        setAvailability([]);  // Clear availability data when sport changes
        setHasCheckedAvailability(false); // Reset check availability flag
        if (venue?.courts?.length) {
            const filtered = venue.courts.filter(court => court.sportname === sport);
            setFilteredCourts(filtered);
        }
    };

    const handleCourtChange = (courtId) => {
        setSelectedCourt(courtId);
        setAvailability([]); // Clear availability data when court changes
        setHasCheckedAvailability(false); // Reset check availability flag
    };

    const checkAvailability = async () => {
        if (!selectedSport || !selectedDate || !selectedCourt) {
            alert("Please select a sport, court, and date.");
            return;
        }

        const localDateMidnight = new Date(selectedDate);
        localDateMidnight.setHours(0, 0, 0, 0);
        const formattedDate = localDateMidnight.toISOString().split("T")[0];

        setCheckingAvailability(true);

        try {
            const response = await apiRequest.post(`/availability/getavailabilitiesbybody/${id}`, {
                date: formattedDate,
                sportname: selectedSport,
                courtId: selectedCourt,
            });

            setAvailability(response.data.availability);
            setHasCheckedAvailability(true); // Set flag to true once availability has been checked
        } catch (error) {
            setAvailability([]);
            alert(error.response?.data?.message || "Failed to fetch availability.");
        } finally {
            setCheckingAvailability(false);
        }
    };

    if (loading) return <p>Loading venue details...</p>;
    if (error) return <p style={{ color: "red" }}>{error}</p>;

    return (
        <div className="booking-container">
            <h2>Select a Sport</h2>
            <select
                className="sport-dropdown"
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
                        className="court-dropdown"
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

            <h2>Select a Date</h2>
            <MyCalendar onDateSelect={(date) => {
                setSelectedDate(date);
                setHasCheckedAvailability(false); // Reset availability check flag when selecting a new date
            }} />

            <button className="availability-btn" onClick={checkAvailability} disabled={!selectedSport || !selectedCourt || !selectedDate}>
                Check Availability
            </button>

            {checkingAvailability ? (
                <p>Checking availability...</p>
            ) : (
                hasCheckedAvailability && availability.length > 0 ? (
                    <AvailabilityGrid availability={availability} />
                ) : (
                    hasCheckedAvailability && <p>No availability found.</p>
                )
            )}
        </div>
    );
}

export default Availability;
