import React, { useEffect, useState,useContext } from "react";
import { useNavigate } from "react-router-dom";
import Nav1 from "../../../defaultPage/userNavigation";
import apiRequest from "../../../lib/apiReq";
import "./userTournamentHistory.css";
import { AuthContext } from "../../context/AuthContext";

function History() {
    const { currentUser } = useContext(AuthContext);
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
            if (currentUser.role!=="user") {
                navigate("/login");
            }
        }, [currentUser, navigate]);

    useEffect(() => {
        const fetchTournaments = async () => {
            try {
                const response = await apiRequest.get(`/tournament/gettournamentbyuserid`);
                setTournaments(response.data.tournaments);
            } catch (error) {
                console.error("Error fetching tournaments:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTournaments();
    }, []);

    const handleCancelRegistration = async (registrationId) => {
        
        try {
            if (!window.confirm("Are you sure you want to cancel your registration?")) return;
            await apiRequest.delete(`/register/cancelregistration/${registrationId}`);
            // Remove the cancelled registration from UI
            setTournaments((prev) => prev.filter((item) => item.id !== registrationId));
            alert("Registration cancelled successfully!");
        } catch (error) {
            console.error("Failed to cancel registration:", error);
            alert("Failed to cancel registration.");
        }
    };



    if (loading) {
        return (
            <div className="user-history-containers">
                <Nav1 />
                <div className="loading-state">Loading your tournament history...</div>
            </div>
        );
    }

    if (tournaments.length === 0) {
        return (
            <div className="user-history-containers">
                <Nav1 />
                <div className="empty-state">No tournament registrations found!</div>
            </div>
        );
    }

    return (
        <div className="user-history-containers">
            <Nav1 />
            <div className="tournament-history-containers">
                <h2 className="tournament-history-title">Your Tournament Registrations</h2>
                <ul className="tournament-history-list">
                    {tournaments.map((item) => (
                        <li
                            className="tournament-history-item"   
                        >
                            <p><strong>Tournament:</strong> {item.tournament?.tournamentName || "N/A"}</p>
                            <p><strong>Venue:</strong> {item.tournament?.venue?.title || "N/A"}</p>
                            <p><strong>Game Day:</strong> {item.tournament?.gameDay || "N/A"}</p>
                            <p><strong>Team Name:</strong> {item.teamName}</p>
                            <p><strong>Phone:</strong> {item.phone}</p>
                            <p><strong>Entry Fee:</strong> Rs. {item.tournament?.entryFee || "N/A"}</p>
                            <p><strong>Status:</strong> {item.registrationStatus}</p>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevents triggering the li click
                                    handleCancelRegistration(item.id); // ✅ Pass registrationId
                                }}
                            >
                                Cancel Registration
                            </button>
                            
                        </li>
                    ))}

                </ul>
            </div>
        </div>
    );
}

export default History;
