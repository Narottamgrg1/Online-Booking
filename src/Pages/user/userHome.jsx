import React, { useContext, useEffect, useState } from "react";
import { FaArrowRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Nav1 from "../../../defaultPage/userNavigation";
import Search from "../../../defaultPage/Search";
import "./userHome.css";
import img1 from "../../../asset/Court1.webp";
import { AuthContext } from "../../context/AuthContext";
import apiRequest from "../../../lib/apiReq";

function UserHome() {
    const { currentUser } = useContext(AuthContext);
    const [venues, setVenues] = useState([]);
    const [tournaments, setTournaments] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
            if (currentUser.role!=="user") {
                navigate("/login");
            }
        }, [currentUser, navigate]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const venueRes = await apiRequest.get(`/venue/getVenues`);
                setVenues(venueRes.data.venues || []);

                const tournamentRes = await apiRequest.get(`/tournament/gettournament`);
                const tournamentList = Array.isArray(tournamentRes.data)
                    ? tournamentRes.data
                    : tournamentRes.data.tournaments || [];
                setTournaments(tournamentList);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="home-container">
            <Nav1 />

            <div className="hero-container">
                <img src={img1} alt="Court1" className="hero-image" />
                <div className="hero-overlay"></div>
                <h1 className="hero-title">The Court Is Yours</h1>
            </div>

            {/* <Search /> */}

            {/* Venues Section */}
            <div className="section-container">
                <div className="section-header">
                    <h2 className="sections-title">Featured Venues</h2>
                    <button 
                        className="view-all-btn" 
                        onClick={() => navigate("/user/book")}
                    >
                        View All <FaArrowRight className="view-all-icon" />
                    </button>
                </div>
                <div className="card-grid">
                    {venues.slice(0, 3).map((venue) => (
                        <div key={venue.id} className="venue-card">
                            <div className="card-image-container">
                                <img 
                                    src={venue.image || img1} 
                                    alt={venue.title} 
                                    className="card-image" 
                                    loading="lazy"
                                />
                            </div>
                            <div className="card-content">
                                <h3 className="card-title">{venue.title}</h3>
                                <p className="card-location">
                                    <span className="location-icon">📍</span> {venue.city}, {venue.address}
                                </p>
                                <div className="card-buttons">
                                    <button 
                                        className="btn view-btn" 
                                        onClick={() => navigate(`/user/venue/${venue.id}`)}
                                    >
                                        View
                                    </button>
                                    <button 
                                        className="btn primary-btn" 
                                        onClick={() => navigate(`/user/booknow/${venue.id}`)}
                                    >
                                        Book Now
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tournament Section */}
            <div className="section-container">
                <div className="section-header">
                    <h2 className="sections-title">Upcoming Tournaments</h2>
                    <button 
                        className="view-all-btn" 
                        onClick={() => navigate("/user/tournament")}
                    >
                        View All <FaArrowRight className="view-all-icon" />
                    </button>
                </div>
                <div className="card-grid">
                    {tournaments.slice(0, 3).map((tournament) => (
                        <div key={tournament.id} className="tournament-card">
                            <div className="tournament-header">
                                <h3 className="tournament-name">{tournament.tournamentName}</h3>
                                <p className="organizer">Organized by: {tournament.organizer}</p>
                            </div>
                            <div className="tournament-details">
                                <div className="detail-item">
                                    <span className="detail-label">Sport:</span>
                                    <span className="detail-value">{tournament.sports.name}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Entry Fee:</span>
                                    <span className="detail-value">Rs.{tournament.entryFee}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Venue:</span>
                                    <span className="detail-value">{tournament.venue.title}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Registration Ends:</span>
                                    <span className="detail-value">
                                        {new Date(tournament.registerEnds).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Game Day:</span>
                                    <span className="detail-value">
                                        {new Date(tournament.gameDay).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                            <div className="tournament-actions">
                                <button 
                                    className="btn secondary-btn"
                                    onClick={() => navigate(`/tournament/${tournament.id}`)}
                                >
                                    View Teams
                                </button>
                                <button 
                                    className="btn primary-btn"
                                    onClick={() => navigate(`/tournament/register/${tournament.id}`)}
                                >
                                    Register Now
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default UserHome;