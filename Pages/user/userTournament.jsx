import React, { useEffect, useState,useContext } from "react";
import Nav1 from "../../../defaultPage/userNavigation";
import apiRequest from "../../../lib/apiReq";
import "./userTournament.css";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

function Tournament() {
  const { currentUser } = useContext(AuthContext);
  const [tournaments, setTournaments] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [registeredTeams, setRegisteredTeams] = useState([]);
  const [showRegisteredPopup, setShowRegisteredPopup] = useState(false);
  const [selectedTournamentId, setSelectedTournamentId] = useState(null);
  const [teamName, setTeamName] = useState("");
  const [phone, setPhone] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
          if (currentUser.role!=="user") {
              navigate("/login");
          }
      }, [currentUser, navigate]);

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const res = await apiRequest.get(`/tournament/gettournament`);
        setTournaments(res.data.tournaments ?? []);
      } catch (error) {
        console.error("Error fetching tournaments:", error);
      }
    };
    fetchTournaments();
  }, []);

  const registeredTeam = async (tournamentId) => {
    try {
      const res = await apiRequest.get(`/register/getregisterteam/${tournamentId}`);
      setRegisteredTeams(res.data.registeredTeam ?? []); // adjust `res.data.teams` to match your API shape
      setShowRegisteredPopup(true);
    } catch (error) {
      console.error("Failed to fetch registered teams");
      alert("Could not fetch registered teams.");
    }
  };

  const submitRegistration = async () => {
    if (!teamName || !phone) {
      alert("Please enter both team name and phone.");
      return;
    }
    try {
      await apiRequest.post(`/register/registerTournament/${selectedTournamentId}`, {
        teamName,
        phone,
      });
      alert("Successfully registered!");
      setShowPopup(false);
      setTeamName("");
      setPhone("");
    } catch (error) {
      console.error("Registration failed:", error);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert("Registration failed.");
      }
    }
  };

  return (
    <div className="tournament-main-container">
      <Nav1 />

      <div className="tournaments-container">
        <h2>Available Tournaments</h2>
        {tournaments.length === 0 ? (
          <p>No tournaments available at the moment.</p>
        ) : (
          <ul className="tournament-list">
            {tournaments.map((tournament) => (
              <li key={tournament.id}>
                <strong>{tournament.tournamentName}</strong> by {tournament.organizer}
                <p>Entry Fee: Rs. {tournament.entryFee}</p>
                <p>Phone: {tournament.phone}</p>
                <p>Sport: {tournament.sports.name}</p>
                <p>Register Ends: {tournament.registerEnds}</p>
                <p>Game Day: {tournament.gameDay}</p>
                <p>Venue: {tournament.venue.title}</p>
                <p>Details: {tournament.Details}</p>
                <div >
                  <button
                    className="register-btn"
                    onClick={() => registeredTeam(tournament.id)}
                  >
                    View Teams
                  </button>
                  <button
                    className="register-btn"
                    onClick={() => {
                      setSelectedTournamentId(tournament.id);
                      setShowPopup(true);
                    }}
                  >
                    Register
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showPopup && (
        <div className="register-popup-overlay">
          <div className="register-popup-content">
            <h2 className="tournament-heading">Register Team</h2>
            <label>
              Team Name:
              <input
               className="tournament-input"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
              />
            </label>
            <label>
              Phone:
              <input
                className="tournament-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </label>
            <div style={{ marginTop: "10px", display: "flex", gap: "100px" }}>
              <button className="tournament-action-btn" onClick={submitRegistration}>Submit</button>
              <button className="tournament-action-btn" onClick={() => setShowPopup(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showRegisteredPopup && (
        <div className="tournament-popup-overlay">
          <div className="tournament-popup-content">
            <h2 className="tournament-heading">Registered Teams</h2>
            <p>Total Registered Teams: {registeredTeams.length}</p>
            {registeredTeams.length === 0 ? (
              <p>No teams have registered yet.</p>
            ) : (
              <div className="registered-team-cards">
                {registeredTeams.map((team, index) => (
                  <div key={index} className="team-card">
                    <p><strong>Team Name:</strong> {team.teamName}</p>
                    <p><strong>Registered By:</strong> {team.user?.name || "Unknown"}</p>
                  </div>
                ))}
              </div>
            )}
            <button
              className="tournament-action-btn"
              onClick={() => setShowRegisteredPopup(false)}
              style={{ marginTop: "20px", width: "100%" }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Tournament;
