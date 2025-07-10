import React, { useEffect, useState,useContext } from "react";
import ManagerNav from "../../../defaultPage/ManagerNav";
import { useNavigate } from "react-router-dom";
import "./managerVenueAdd.css";
import UploadWidget from "../../../defaultPage/UploadWidget";
import apiRequest from "../../../lib/apiReq";
import { AuthContext } from "../../context/AuthContext";

function VenueEdit() {
    const { currentUser } = useContext(AuthContext);
    const [sportsList, setSportsList] = useState([]);
    const [selectedSports, setSelectedSports] = useState([]);
    const [newSport, setNewSport] = useState("");
    const [courts, setCourts] = useState([]);
    const [showDetails, setShowDetails] = useState(false);
    const [imgs, setImgs] = useState([]);
    const [error, setError] = useState("");
    const [openingTime, setOpeningTime] = useState("");
    const [closingTime, setClosingTime] = useState("");
    const [loyaltyEnabled, setLoyaltyEnabled] = useState(false);
    const [loyaltyPoint, setLoyaltyPoint] = useState("");


    const navigate = useNavigate();

    const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

    const [openingHours, setOpeningHours] = useState(
        daysOfWeek.map(day => ({ day, open: "", close: "" }))
    );

    const handleOpeningHoursChange = (index, field, value) => {
        const updated = [...openingHours];
        updated[index][field] = value;
        setOpeningHours(updated);
    };

    useEffect(() => {
                if (currentUser.role!=="manager") {
                    navigate("/login");
                }
            }, [currentUser, navigate]);

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

    const handleRemoveSport = (sportToRemove) => {
        setSelectedSports(selectedSports.filter(sport => sport !== sportToRemove));
    };

    const handleInputChange = (index, e) => {
        const { name, value } = e.target;
        const updatedCourts = [...courts];
        updatedCourts[index][name] = value;
        setCourts(updatedCourts);
    };

    const handleAddCourt = () => {
        setCourts([...courts, { title: "", price_per_hour: "", status: "Available", sportName: "" }]);
    };

    const handleRemoveCourt = (index) => {
        setCourts(courts.filter((_, i) => i !== index));
    };

    const toggleDetails = () => {
        setShowDetails(!showDetails);
    };

    const handleRemoveImage = (index) => {
        setImgs(imgs.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const inputs = Object.fromEntries(formData);

        const venueData = {
            title: inputs.name,
            address: inputs.address,
            city: inputs.city,
            longitude: Number(inputs.longitude),
            latitude: Number(inputs.latitude),
            sports: selectedSports,
            imgs: imgs,
            loyaltyCard: loyaltyEnabled,
            loyaltyPoint: loyaltyEnabled ? Number(loyaltyPoint) : null,

        };

        const venueCourts = courts.map((court) => ({
            title: court.title,
            price_per_hour: Number(court.price_per_hour),
            status: court.status,
            sportName: court.sportName,
        }));

        const venueDetails = {
            openinghours: daysOfWeek.map(day => `${day} ${openingTime}am-${closingTime}pm`),

            venuepolicy: inputs.policies || "",
            amenities: inputs.services ? inputs.services.split(",").map(s => s.trim()) : [],
        };

        try {
            const res = await apiRequest.post("/venue/addVenue", { venueData, venueCourts, venueDetails });

            if (res && res.data && res.data.newVenue && res.data.newVenue.id) {
                localStorage.setItem("venue_data", JSON.stringify(res.data.newVenue));
                const venueId = res.data.newVenue.id;
                const createdCourts = res.data.newVenue.courts;

                const updatedCourts = createdCourts.map(court => ({
                    ...court,
                    courtId: court.id
                }));

                const availabilityPromises = updatedCourts.map((court) => {
                    return apiRequest.post("/availability/genavailability", {
                        venueId,
                        courtId: court.courtId,
                        openingHours: venueDetails.openinghours,
                    });
                });

                await Promise.all(availabilityPromises);

                navigate("/manager/Court/");
            } else {
                setError("Error: Venue ID not returned");
            }
        } catch (err) {
            console.error("Error submitting venue:", err);
            setError("Error submitting venue. Please try again.");
        }
    };

    return (
        <div className="manager-main-container">
            <ManagerNav />
            <div className="edit-container">
                <form onSubmit={handleSubmit}>
                    <div className="add-venue">
                        <h1>Venue</h1>

                        <div className="name">
                            <label htmlFor="name">Venue Name:</label>
                            <input className="input-feild" type="text" id="title" name="name" placeholder="Enter text here" />
                        </div>

                        <div className="address">
                            <label htmlFor="address">Address</label>
                            <input className="input-feild" type="text" id="address" name="address" placeholder="Enter text here" />
                        </div>

                        <div className="city">
                            <label htmlFor="city">City</label>
                            <input className="input-feild" type="text" id="city" name="city" placeholder="Enter text here" />
                        </div>

                        {selectedSports.length > 0 && (
                            <div className="selected-sports">
                                <label>Selected Sports</label>
                                <p>
                                    {selectedSports.map((sport, index) => (
                                        <span key={index}>
                                            Sport {index + 1}: {sport}{" "}
                                            <button className="remove-sport-btn" type="button" onClick={() => handleRemoveSport(sport)}>✖</button>
                                        </span>
                                    ))}
                                </p>
                            </div>
                        )}

                        <div className="sports">
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

                        <div className="add-sport">
                            <input
                                className="input-feild"
                                type="text"
                                placeholder="Add new sport"
                                value={newSport}
                                onChange={(e) => setNewSport(e.target.value)}
                            />
                            <button className="manager-add-btn" onClick={handleAddSport}>Add Sport</button>
                        </div>

                        <div className="long-lat">
                            <label htmlFor="longitude">Longitude</label>
                            <input className="input-feild" type="text" id="longitude" name="longitude" />
                            <label htmlFor="latitude">Latitude</label>
                            <input className="input-feild" type="text" id="latitude" name="latitude" />
                        </div>

                        <div className="loyalty">
                            <label>Enable Loyalty Card:</label>
                            <div>
                                <label>
                                    <input
                                        type="radio"
                                        name="loyaltyCard"
                                        value="true"
                                        onChange={() => setLoyaltyEnabled(true)}
                                    /> Yes
                                </label>
                                <label>
                                    <input
                                        type="radio"
                                        name="loyaltyCard"
                                        value="false"
                                        onChange={() => setLoyaltyEnabled(false)}
                                    /> No
                                </label>
                            </div>

                            {loyaltyEnabled && (
                                <div>
                                    <label htmlFor="loyaltyPoint">Loyalty Points Needed for Redemption:</label>
                                    <input
                                        type="number"
                                        id="loyaltyPoint"
                                        name="loyaltyPoint"
                                        value={loyaltyPoint}
                                        onChange={(e) => setLoyaltyPoint(e.target.value)}
                                        className="input-feild"
                                        min="1"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="imgs">
                            <label>Upload your Venue images</label>
                            {imgs.length > 0 ? (
                                <div style={{ display: "flex", flexWrap: "wrap" }}>
                                    {imgs.map((img, index) => (
                                        <div key={index} className="img-container">
                                            <img src={img} alt={`Venue ${index}`} />
                                            <button type="button" className="remove-img-btn" onClick={() => handleRemoveImage(index)}>❌</button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p>No images uploaded yet</p>
                            )}
                            <div className="upload-container">
                                <UploadWidget
                                    uwConfig={{
                                        cloudName: "gbros",
                                        uploadPreset: "CourtBook",
                                        multiple: true,
                                        folder: "Venue"
                                    }}
                                    setState={setImgs}
                                    multiple={true}
                                />
                            </div>
                        </div>

                    </div>

                    <div className="add-court">
                        <button className="manager-add-btn" type="button" onClick={handleAddCourt}>Add Court</button>
                        {courts.length > 0 && (
                            <div className="courts-container">
                                <label>Courts</label>
                                {courts.map((court, index) => (
                                    <div key={index} className="court-item">
                                        <h4>Court {index + 1}</h4>
                                        <input
                                            className="input-feild"
                                            type="text"
                                            name="title"
                                            placeholder="Court Title"
                                            value={court.title}
                                            onChange={(e) => handleInputChange(index, e)}
                                        />
                                        <input
                                            className="input-feild"
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
                                            name="sportName"
                                            value={court.sportName}
                                            onChange={(e) => handleInputChange(index, e)}
                                        >
                                            <option value="">Select Sport</option>
                                            {sportsList.map((sport, i) => (
                                                <option key={i} value={sport.name}>
                                                    {sport.name}
                                                </option>
                                            ))}
                                        </select>
                                        <button type="button" className="remove-btn" onClick={() => handleRemoveCourt(index)}>
                                            ❌ Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="add-details">
                        <button className="manager-add-btn" type="button" onClick={toggleDetails}>Add Details</button>
                        {showDetails && (
                            <div className="details-container">
                                <div>
                                    <label htmlFor="policies">Venue Policies:</label>
                                    <input
                                        className="input-feild"
                                        type="text"
                                        id="policies"
                                        name="policies"
                                        placeholder="Enter venue policies"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="services">Venue Services:</label>
                                    <input
                                        className="input-feild"
                                        type="text"
                                        id="services"
                                        name="services"
                                        placeholder="eg. parking, food, etc."
                                    />
                                </div>

                                <div className="opening-hours">
                                    <label>Opening & Closing Hours (applied to all days):</label>
                                    <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                                        <input
                                            className="input-feild"
                                            type="number"
                                            min="1"
                                            max="12"
                                            placeholder="Open (AM)"
                                            value={openingTime}
                                            onChange={(e) => setOpeningTime(e.target.value)}
                                        />
                                        <span>AM</span>
                                        <input
                                            className="input-feild"
                                            type="number"
                                            min="1"
                                            max="12"
                                            placeholder="Close (PM)"
                                            value={closingTime}
                                            onChange={(e) => setClosingTime(e.target.value)}
                                        />
                                        <span>PM</span>
                                    </div>
                                </div>

                            </div>
                        )}
                    </div>

                    {error && <p className="error">{error}</p>}
                    <button className="manager-add-btn" type="submit">Submit</button>
                </form>
            </div>
        </div>
    );
}

export default VenueEdit;
