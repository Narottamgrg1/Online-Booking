import React, { useEffect, useState } from "react";
import ManagerNav from "../../../defaultPage/ManagerNav";
import { useNavigate } from "react-router-dom";
import "./managerVenueUpdate.css";
import UploadWidget from "../../../defaultPage/UploadWidget";
import apiRequest from "../../../lib/apiReq";

function VenueUpdate() {
    const [currentVenue, setCurrentVenue] = useState(JSON.parse(localStorage.getItem("venue_data")) || [])
    const [sportsList, setSportsList] = useState([]);
    const [selectedSports, setSelectedSports] = useState(currentVenue.sports || []);
    const [newSport, setNewSport] = useState("");
    const [courts, setCourts] = useState(currentVenue?.courts || []);
    const [showDetails, setShowDetails] = useState(currentVenue?.details || false);
    const [venueDetails, setVenueDetails] = useState(currentVenue?.details || {});
    const [imgs, setImgs] = useState(currentVenue?.imgs || []);
    const [isLoading, setLoading] = useState(false); // Loading state
    const navigate = useNavigate();
    const [error, setError] = useState("");

    const handleRemoveImage = (index) => {
        setImgs(imgs.filter((_, i) => i !== index));
    };

    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    const [openingHours, setOpeningHours] = useState(
        currentVenue?.details?.openinghours?.length === 7
            ? currentVenue.details.openinghours.map(entry => {
                // Remove unnecessary lines like "Closing Time"
                const cleanedEntry = entry.replace("Closing Time", "").trim();

                // Split the cleaned entry into day and time parts
                const [day, time] = cleanedEntry.split(/\s+/); // Split by whitespace
                const [open, close] = time ? time.split("-") : ["", ""]; // Handle missing time

                return {
                    day: day || "", // Fallback if day is missing
                    open: open || "", // Fallback if open time is missing
                    close: close || "", // Fallback if close time is missing
                };
            })
            : daysOfWeek.map(day => ({ day, open: "", close: "" })) // Fallback for missing or invalid data
    );

    useEffect(() => {
        const fetchSports = async () => {
            try {
                const response1 = await apiRequest.get("/sport/getSport");
                setSportsList(response1.data);
            } catch (error) {
                console.error("Error fetching sports:", error);
            }
        };
        fetchSports();
    }, []);

    // const currentVenue = JSON.parse(localStorage.getItem("venue_data"));

    const handleSportChange = (e) => {
        const selectedSport = e.target.value;
        if (selectedSport && !selectedSports.includes(selectedSport)) {
            setSelectedSports([...selectedSports, selectedSport]);
        }
    };

    const handleAddSport = async (e) => {
        e.preventDefault();
        if (newSport.trim() && !sportsList.some((sport) => sport.name === newSport)) {
            try {
                const sportResponse = await apiRequest.post("/sport/addSport", { name: newSport });
                setSportsList([...sportsList, sportResponse.data]);
                setNewSport("");
            } catch (error) {
                console.error("Error adding sport:", error);
            }
        }
    };

    const handleInputChange = (index, e) => {
        const { name, value } = e.target;
        const updatedCourts = [...courts];
        updatedCourts[index][name] = value;
        setCourts(updatedCourts);
    };

    const handleAddCourt = () => {
        setCourts([...courts, { title: "", price_per_hour: "", status: "Available", sportname: "" }]);
    };

    const handleRemoveCourt = (index) => {
        setCourts(courts.filter((_, i) => i !== index));
    };

    const toggleDetails = () => {
        setShowDetails(!showDetails);
    };

    const handleOpeningHoursChange = (index, field, value) => {
        const updatedHours = [...openingHours];
        updatedHours[index][field] = value;
        setOpeningHours(updatedHours);
    };

    const handleRemoveSport = (sportToRemove, e) => {
        e.preventDefault();  // Prevent form submission on button click
        setSelectedSports(selectedSports.filter(sport => sport !== sportToRemove));
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        const formData = new FormData(e.target);
        const inputs = Object.fromEntries(formData);

        const venueData = {
            title: inputs["venue-name"],
            address: inputs.address,
            city: inputs.city,
            longitude: Number(inputs.longitude),
            latitude: Number(inputs.latitude),
            sports: selectedSports,
            imgs: imgs,
        };

        const venueCourts = courts.map((court) => ({
            title: court.title,
            price_per_hour: Number(court.price_per_hour),
            status: court.status,
            sportname: court.sportname,
            id: court.id || null,
        }));

        const updatedVenueDetails = {
            venuepolicy: inputs.policies || "",
            amenities: inputs.services
                ? inputs.services.split(",").map((s) => s.trim())
                : [],
            openinghours: openingHours.map(entry => `${entry.day} ${entry.open}-${entry.close}`),
        };


        // Save updated venueDetails to state so input reflects latest on re-render
        setVenueDetails(updatedVenueDetails);

        const openingHourData = openingHours.map((entry) => ({
            day: entry.day,
            open: entry.open,
            close: entry.close,
        }));

        try {
            // 1. Update basic venue info
            const venueRes = await apiRequest.put(`/venue/update/${currentVenue.id}`, {
                venueData,
                venueCourts,
                venueDetails: updatedVenueDetails,
            });

            if (!venueRes.data.venue) {
                throw new Error("Venue update failed. No venue data received.");
            }

            // 2. Update opening hours/time separately
            await apiRequest.put(`/availability/updatevenuetime/${currentVenue.id}`, {
                time: openingHourData,
            });

            // 3. Update localStorage & redirect
            const updatedVenue = venueRes.data.venue;
            localStorage.setItem("venue_data", JSON.stringify(updatedVenue));
            navigate("/manager/Court/");
        } catch (err) {
            console.error("Error updating venue:", err);
            setError(
                `Error updating venue: ${err.response?.data?.message || err.message || "Unknown error"
                }`
            );
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="manager-mains-container">
            <ManagerNav />
            <div className="manageredit-container">
                <form onSubmit={handleSubmit}>
                    <div className="add-venue-update">
                        <h1>Update Venue</h1>

                        <div className="manager-venue-name">
                            <label htmlFor="venue-name">Venue Name:</label>
                            <input type="text" id="title" name="venue-name" placeholder="Enter text here" defaultValue={currentVenue.title} />
                        </div>

                        <div className="manager-address">
                            <label htmlFor="address">Address</label>
                            <input type="text" id="address" name="address" placeholder="Enter text here" defaultValue={currentVenue.address} />
                        </div>

                        <div className="manager-city">
                            <label htmlFor="city">City</label>
                            <input type="text" id="city" name="city" placeholder="Enter text here" defaultValue={currentVenue.city} />
                        </div>

                        {selectedSports.length > 0 && (
                            <div className="manager-selected-sports">
                                <label>Selected Sports</label>
                                <div className="manager-sports-list">
                                    {selectedSports.map((sport, index) => (
                                        <div key={index} className="manager-selected-sport-item">
                                            <span>{`Sport${index + 1}: ${sport}`}</span>
                                            <button
                                                className="remove-sport-btn"
                                                onClick={(e) => handleRemoveSport(sport, e)}
                                            >
                                                ✖
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}




                        <div className="manager-sports">
                            <label htmlFor="sports">Choose Sports</label>
                            <select id="sports" onChange={handleSportChange}>
                                <option value="">Select Sport</option>
                                {sportsList.map((sport, index) => (
                                    <option key={index} value={sport.name}>
                                        {sport.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="add-sport-c">
                            <input

                                type="text"
                                placeholder="Add new sport"
                                value={newSport}
                                onChange={(e) => setNewSport(e.target.value)}
                            />
                            <button className="add-sport-c-button" onClick={handleAddSport}>Add Sport</button>
                        </div>

                        <div className="long-lat">
                            <label htmlFor="longitude">Longitude</label>
                            <input type="text" id="longitude" name="longitude" defaultValue={currentVenue.longitude} />
                            <label htmlFor="latitude">Latitude</label>
                            <input type="text" id="latitude" name="latitude" defaultValue={currentVenue.latitude} />
                        </div>

                        <div className="manager-court-imgs">
                            <label>Upload your Venue images</label>
                            {imgs.length > 0 ? (
                                imgs.map((img, index) => (
                                    <div key={index} className="img-container">
                                        <button  className="remove-img-btn" onClick={() => handleRemoveImage(index)}>✖</button>
                                        <img src={img} alt={`Venue ${index}`} />
                                    </div>
                                ))
                            ) : (
                                <p>No images uploaded yet</p>
                            )}


                            <UploadWidget
                                className="manager-upload-btn"
                                uwConfig={{
                                    cloudName: "gbros",
                                    uploadPreset: "CourtBook",
                                    multiple: true,
                                    folder: "Venue"
                                }}
                                setState={setImgs}
                                multiple={true} // Ensure multiple uploads are enabled
                            />
                        </div>
                    </div>

                    <div className="manager-add-court">
                        <button className="manager-upt-btn" type="button" onClick={handleAddCourt}>
                            Add Court
                        </button>

                        {courts.length > 0 && (
                            <div className="manager-courts-container">
                                <label>Courts</label>
                                {courts.map((court, index) => (
                                    <div key={index} className="manager-court-item">
                                        <h4>Court {index + 1}</h4>
                                        <input
                                            type="text"
                                            name="title"
                                            placeholder="Court Title"
                                            value={court.title}
                                            onChange={(e) => handleInputChange(index, e)}
                                        />
                                        <input
                                            type="text"
                                            name="price_per_hour"
                                            placeholder="Price per Hour"
                                            value={court.price_per_hour}

                                            onChange={(e) => handleInputChange(index, e)}
                                        />
                                        <select
                                            name="status"
                                            value={court.status}
                                            onChange={(e) => handleInputChange(index, e)}
                                        >
                                            <option value="Available">Available</option>
                                            <option value="Unavailable">Unavailable</option>
                                        </select>
                                        <select
                                            name="sportname"
                                            value={court.sportname}
                                            onChange={(e) => handleInputChange(index, e)}
                                        >
                                            <option value="">Select Sport</option>
                                            {sportsList.map((sport, i) => (
                                                <option key={i} value={sport.name}>
                                                    {sport.name}
                                                </option>
                                            ))}
                                        </select>
                                        <button  className="remove-btn" onClick={() => handleRemoveCourt(index)}>
                                            ❌ Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="manager-add-details">
                        <button className="manager-upt-btn" type="button" onClick={toggleDetails}>
                            Add Details
                        </button>

                        {showDetails && (
                            <div className="manager-details-container">
                                <div>
                                    <label htmlFor="policies">Venue Policies:</label>
                                    <input
                                        type="text"
                                        id="policies"
                                        name="policies"
                                        placeholder="Enter venue policies"
                                        defaultValue={showDetails.venuepolicy}
                                    />
                                </div>

                                <div className="manager-policies">
                                    <label htmlFor="services">Venue Services:</label>
                                    <input
                                        type="text"
                                        id="services"
                                        name="services"
                                        placeholder="eg. parking, food, etc."
                                        defaultValue={showDetails.amenities}
                                    />
                                </div>

                                <div className="manager-hours">
                                    <label >Opening Hours</label>
                                    {openingHours.map((entry, index) => (
                                        <div key={index} className="opening-hours-row">
                                            <label>{entry.day + ":"}</label>
                                            <input
                                                type="text"
                                                value={entry.open}
                                                onChange={(e) => handleOpeningHoursChange(index, "open", e.target.value)}
                                                placeholder="Opening Time"
                                            />
                                            <input
                                                type="text"
                                                value={entry.close}
                                                onChange={(e) => handleOpeningHoursChange(index, "close", e.target.value)}
                                                placeholder="Closing Time"
                                            />
                                        </div>
                                    ))}

                                </div>
                            </div>
                        )}
                    </div>


                    <button className="manager-upt-btn" type="submit" disabled={isLoading}>
                        {isLoading ? "Updating..." : "Update"}
                    </button>

                    {error && <span className="error">{error}</span>}
                </form>
            </div>
        </div>
    );
}

export default VenueUpdate;
