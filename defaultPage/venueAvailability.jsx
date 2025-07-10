import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import moment from "moment";
import apiRequest from "../lib/apiReq";
import MyCalendar from "./Calendar";
import Nav from "./NavigationBar";
import "../src/Pages/user/userBookNow.css";
// import ProgressBar from "../../../defaultPage/ProgressBar";

function Booknow() {
    const { id } = useParams();
    const [venue, setVenue] = useState(null);
    const [selectedSport, setSelectedSport] = useState("");
    const [filteredCourts, setFilteredCourts] = useState([]);
    const [courtId, setCourtId] = useState("");
    const [date, setDate] = useState(null);
    const [availability, setAvailability] = useState([]);
    const [startTime, setStartTime] = useState("");
    const [duration, setDuration] = useState(1);
    const [message, setMessage] = useState("");
    const [availableDurations, setAvailableDurations] = useState([1]);
    const [lastEndTime, setLastEndTime] = useState(null);
    const [challengeMode, setChallengeMode] = useState(false);
    const navigate = useNavigate();

    const [isEditing, setIsEditing] = useState(false);
    const [fieldsToDelete, setFieldsToDelete] = useState([]);

    useEffect(() => {
        const fetchVenue = async () => {
            try {
                const res = await apiRequest.get(`/venue/getvenue/${id}`);
                setVenue(res.data);
            } catch (err) {
                setMessage("❌ Failed to load venue");
            }
        };
        if (id) fetchVenue();
    }, [id]);

    const handleSportChange = (sport) => {
        setSelectedSport(sport);
        const courts = venue?.courts?.filter((court) => court.sportname === sport);
        setFilteredCourts(courts || []);
        setCourtId("");
        setAvailability([]);
        setStartTime("");
        setDuration(1);
        setAvailableDurations([1]);
        setLastEndTime(null);
    };

    const checkAvailability = async () => {
        if (!courtId || !date || !selectedSport) {
            alert("Please select court, date, and sport.");
            return;
        }

        const dateString = moment(date).format("YYYY-MM-DD");

        try {
            const res = await apiRequest.post(`/availability/getavailabilitiesbybody/${id}`, {
                courtId,
                sportname: selectedSport,
                date: dateString,
            });
            const allSlots = res.data.availability || [];
            const availableSlots = allSlots.filter((slot) => slot.isAvailable);

            setAvailability(availableSlots);

            if (allSlots.length > 0 && availableSlots.length === 0) {
                setMessage("❌ All court bookings are full for this date.");
            } else {
                setMessage("");
            }


            if (availableSlots.length > 0) {
                const maxEndTime = Math.max(...availableSlots.map((slot) => slot.endTime));
                setLastEndTime(maxEndTime);
            }
        } catch (err) {
            setMessage("❌ Venue is closed at the moment.");
            setAvailability([]);
        }
    };

    useEffect(() => {
        if (startTime !== "" && availability.length > 0) {
            const start = parseInt(startTime);
            let maxConsecutiveSlots = 0;
            let currentConsecutiveCount = 0;
            for (let i = 0; i < availability.length; i++) {
                if (availability[i].startTime === start + currentConsecutiveCount) {
                    currentConsecutiveCount++;
                    maxConsecutiveSlots = Math.max(maxConsecutiveSlots, currentConsecutiveCount);
                } else {
                    currentConsecutiveCount = 0;
                }
            }

            const validDurations = Array.from(
                { length: Math.min(maxConsecutiveSlots, 4) },
                (_, i) => i + 1
            );
            setAvailableDurations(validDurations.length > 0 ? validDurations : [1]);
        }
    }, [startTime, availability]);



    const handleEditToggle = () => {
        if (isEditing && fieldsToDelete.length > 0) {
            fieldsToDelete.forEach((field) => {
                switch (field) {
                    case "sport":
                        setSelectedSport("");
                        setFilteredCourts([]);
                        setCourtId("");
                        setAvailability([]);
                        setStartTime("");
                        setDuration(1);
                        setAvailableDurations([1]);
                        break;
                    case "court":
                        setCourtId("");
                        setAvailability([]);
                        setStartTime("");
                        setDuration(1);
                        setAvailableDurations([1]);
                        break;
                    case "date":
                        setDate(null);
                        setAvailability([]);
                        setStartTime("");
                        setDuration(1);
                        break;
                    case "startTime":
                        setStartTime("");
                        setDuration(1);
                        break;
                    case "duration":
                        setDuration(1);
                        break;
                    default:
                        break;
                }
            });
            setFieldsToDelete([]);
            setIsEditing(false);
        } else {
            setIsEditing(!isEditing);
        }
    };

    const renderSummaryField = (label, value, fieldKey) => (
        <div className="summary-field" key={fieldKey || label}>
            {isEditing && fieldKey && (
                <input
                    type="checkbox"
                    className="delete-checkbox"
                    checked={fieldsToDelete.includes(fieldKey)}
                    onChange={(e) => {
                        if (e.target.checked) {
                            setFieldsToDelete([...fieldsToDelete, fieldKey]);
                        } else {
                            setFieldsToDelete(fieldsToDelete.filter((f) => f !== fieldKey));
                        }
                    }}
                />
            )}
            <p>
                <strong>{label}:</strong> {value}
            </p>
        </div>
    );

    return (
        <div className="book-container">
            <Nav />
            {/* <ProgressBar currentStep={"Booking"} /> */}
            <div className="booking-wrapper">
                {/* Left: Booking Form */}
                <div className="booking-form">
                    <label>Sport:</label>
                    <select value={selectedSport} onChange={(e) => handleSportChange(e.target.value)}>
                        <option value="">Select a sport</option>
                        {venue?.sports?.map((sport, idx) => (
                            <option key={idx} value={sport}>
                                {sport}
                            </option>
                        ))}
                    </select>

                    {filteredCourts.length > 0 && (
                        <>
                            <label>Court:</label>
                            <select value={courtId} onChange={(e) => setCourtId(e.target.value)}>
                                <option value="">Select a court</option>
                                {filteredCourts.map((court) => (
                                    <option key={court.id} value={court.id}>
                                        {court.title}
                                    </option>
                                ))}
                            </select>
                        </>
                    )}

                    <label>Date:</label>
                    <MyCalendar onDateSelect={setDate} />

                    <div className="button-group">
                        <button
                            className="checkavailability"
                            onClick={checkAvailability}
                            disabled={!courtId || !date || !selectedSport}
                        >
                            Check Availability
                        </button>


                    </div>



                    {availability.length > 0 && (
                        <>
                            <h3>Available Time Slots:</h3>
                            <div className="time-slots">
                                {availability.map((slot, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() =>
                                            setStartTime(parseInt(startTime) === slot.startTime ? "" : slot.startTime)
                                        }
                                        className={`time-slot-button ${parseInt(startTime) === slot.startTime ? "selected" : ""
                                            }`}
                                    >
                                        {moment(slot.startTime, "H").format("h:mm A")}
                                    </button>
                                ))}
                            </div>

                            <label>Duration (in hours):</label>
                            <select value={duration} onChange={(e) => setDuration(e.target.value)}>
                                {availableDurations.map((dur, idx) => (
                                    <option key={idx} value={dur}>
                                        {dur} hour{dur > 1 ? "s" : ""}
                                    </option>
                                ))}
                            </select>
                        </>
                    )}

                    {message && <p>{message}</p>}
                </div>

                {/* Right: Booking Summary */}
                <div className="buttons-container">
                    <div className="booking-summary-card">
                        <h3>Booking Summary</h3>

                        {renderSummaryField("Venue", venue?.title)}
                        {renderSummaryField("Address", `${venue?.address || ""}, ${venue?.city || ""}`)}
                        {renderSummaryField("Sport", selectedSport, "sport")}
                        {renderSummaryField(
                            "Court",
                            filteredCourts.find((c) => c.id === courtId)?.title,
                            "court"
                        )}
                        {renderSummaryField(
                            "Date",
                            date ? moment(date).format("LL") : "",
                            "date"
                        )}
                        {renderSummaryField(
                            "Start Time",
                            startTime !== "" ? moment(startTime, "H").format("h:mm A") : "",
                            "startTime"
                        )}
                        {renderSummaryField(
                            "Duration",
                            duration ? `${duration} hour${duration > 1 ? "s" : ""}` : "",
                            "duration"
                        )}
                        {renderSummaryField("Mode", challengeMode ? "Challenge" : "Normal")}

                        <button className="summary-edit-btn" onClick={handleEditToggle}>
                            {isEditing ? "Delete" : "Edit"}
                        </button>
                        <button
                            className="summary-book-btn"
                            onClick={() => {
                                const user = JSON.parse(localStorage.getItem("user"));
                                if (!user) {
                                    const confirmLogin = window.confirm("You must be logged in to Book. Do you want to login now?");
                                    if (confirmLogin) {
                                        navigate("/login");
                                    }
                                    return;
                                }

                            }}
                            disabled={!courtId || !date || startTime === ""}
                        >
                            Book
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Booknow;
