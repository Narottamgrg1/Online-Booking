import React, { useEffect, useState,useContext } from "react";
import ManagerNav from "../../../defaultPage/ManagerNav";
import "./managerTournament.css";
import apiRequest from "../../../lib/apiReq";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

function Tournament() {
  const { currentUser } = useContext(AuthContext);
  const [venue, setVenue] = useState(null);
  const [sportsList, setSportsList] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [showRegisteredTeamsPopup, setShowRegisteredTeamsPopup] = useState(false);
  const [registeredTeams, setRegisteredTeams] = useState([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState(null);
  const [editingTournamentId, setEditingTournamentId] = useState(null);

  // Form states
  const [entryFee, setEntryFee] = useState("");
  const [totalTeams, setTotalTeams] = useState("");
  const [gameEndDay, setGameEndDay] = useState("");
  const [phone, setPhone] = useState("");
  const [tournamentName, setTournamentName] = useState("");
  const [organizer, setOrganizer] = useState("");
  const [details, setDetails] = useState("");
  const [registerEnds, setRegisterEnds] = useState("");
  const [gameDay, setGameDay] = useState("");
  const [selectedSportId, setSelectedSportId] = useState("");
  const [courts, setCourts] = useState([]);
  const [selectedCourtId, setSelectedCourtId] = useState("");


  const [availableSports, setAvailableSports] = useState([]);
  const [availableSportsSportNames, setAvailableSportsSportNames] = useState([]);
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
      if (venueData.courts) {
        setCourts(venueData.courts);

        // Extract unique sport names from venue courts
        const sportNames = [...new Set(venueData.courts.map(court => court.sportname))];

        // Filter sportsList to include only those sports in sportNames
        // But sportsList might not be loaded yet here, so do it in a separate effect
        setAvailableSports([]); // initially clear
        // Save sportNames for later filtering in another effect
        setAvailableSportsSportNames(sportNames);
      }
    } else {
      alert("Venue data not found. Please login again.");
    }
  }, []);

  useEffect(() => {
    if (sportsList.length > 0 && availableSportsSportNames.length > 0) {
      const filtered = sportsList.filter((sport) =>
        availableSportsSportNames.includes(sport.name)
      );
      setAvailableSports(filtered);
    }
  }, [sportsList, availableSportsSportNames]);

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

  useEffect(() => {
    const fetchTournaments = async () => {
      if (!venue) return;
      try {
        const res = await apiRequest.get(`/tournament/gettournamentbyid/${venue.id}`);
        setTournaments(res.data.tournaments ?? []);
      } catch (error) {
        console.error("Error fetching tournaments:", error);
      }
    };
    fetchTournaments();
  }, [venue]);

  const handleCreate = async () => {
    if (!selectedSportId || !gameDay) {
      alert("Please select a sport and game day.");
      return;
    }

    try {
      if (editingTournamentId) {
        // UPDATE logic
        await apiRequest.put(`/tournament/update/${editingTournamentId}`, {
          entryFee,
          phone,
          tournamentName,
          organizer,
          details,
          registerEnds,
          gameDay,
          gameEndDay,
          totalTeams: Number(totalTeams),
          sportsId: selectedSportId,
          CourtId: selectedCourtId,
        });
        alert("Tournament updated!");
      } else {
        // CREATE logic
        await apiRequest.post(`/tournament/create/${venue.id}`, {
          entryFee,
          phone,
          tournamentName,
          organizer,
          details,
          registerEnds,
          gameDay,
          gameEndDay,
          totalTeams: Number(totalTeams),
          sportsId: selectedSportId,
          CourtId: selectedCourtId, // ✅ Add this
        });

        alert("Tournament created!");
      }

      setShowPopup(false);
      setEditingTournamentId(null);
      const res = await apiRequest.get(`/tournament/gettournamentbyid/${venue.id}`);
      setTournaments(res.data.tournaments ?? []);

      // Reset form
      setEntryFee("");
      setPhone("");
      setTournamentName("");
      setOrganizer("");
      setDetails("");
      setTotalTeams("");
      setRegisterEnds("");
      setGameDay("");
      setGameEndDay("");
      setSelectedSportId("");
    } catch (error) {
      console.error("Error submitting tournament:", error);
      alert("Failed to submit tournament.");
    }
  };

  const handleUpdate = (tournament) => {
    setEditingTournamentId(tournament.id);
    setTournamentName(tournament.tournamentName);
    setOrganizer(tournament.organizer);
    setSelectedSportId(tournament.sportsId);
    setEntryFee(tournament.entryFee);
    setTotalTeams(tournament.totalTeams);
    setPhone(tournament.phone);
    setDetails(tournament.Details);
    setRegisterEnds(tournament.registerEnds?.split("T")[0]);
    setGameDay(tournament.gameDay?.split("T")[0]);
    setGameEndDay(tournament.gameEndDay?.split("T")[0]);
    setShowPopup(true);
  };

  const handleDelete = async (tournamentId) => {
    if (!window.confirm("Are you sure you want to delete this tournament?")) return;
    try {
      await apiRequest.delete(`/tournament/delete/${tournamentId}`);
      alert("Tournament deleted!");
      const res = await apiRequest.get(`/tournament/gettournamentbyid/${venue.id}`);
      setTournaments(res.data.tournaments ?? []);
    } catch (error) {
      console.error("Error deleting tournament:", error);
      alert("Failed to delete tournament.");
    }
  };

  const handleShowRegisteredTeams = async (tournamentId) => {
    setSelectedTournamentId(tournamentId);
    try {
      const res = await apiRequest.get(`/register/getregisterteam/${tournamentId}`);
      setRegisteredTeams(res.data.registeredTeam ?? []);
      setShowRegisteredTeamsPopup(true);
    } catch (error) {
      console.error("Error fetching registered teams:", error);
    }
  };

  return (
    <div className="main-tournament-container">
      <ManagerNav />
      <div className="tournament-container">
        <div className="tournament-header">
          <h2>Current Tournaments</h2>
          <button className="tournament-btn" onClick={() => setShowPopup(true)}>
            Create Tournament
          </button>
        </div>

        {tournaments.length === 0 ? (
          <p>No tournaments found.</p>
        ) : (
          <ul>
            {tournaments.map((tournament) => (
              <li className="tournament-container-li" key={tournament.id}>
                <strong>{tournament.tournamentName}</strong> by {tournament.organizer}
                <br />
                Sport: {tournament.sports?.name ?? "N/A"}
                <br />
                Entry Fee: {tournament.entryFee}
                <br />
                Total Teams: {tournament.totalTeams}
                <br />
                Phone: {tournament.phone}
                <br />
                Details: {tournament.Details}
                <br />
                Register Ends: {tournament.registerEnds}
                <br />
                Game Day: {tournament.gameDay}
                <br />
                Game End Day: {tournament.gameEndDay}

                {/* Registered Teams button aligned to top right */}
                <button
                  className="register-btn top-right"
                  onClick={() => handleShowRegisteredTeams(tournament.id)}
                >
                  Registered Teams
                </button>

                {/* Action buttons at bottom left and right */}
                <div className="tournament-actions">
                  <button
                    className="register-btn"
                    onClick={() => handleUpdate(tournament)}
                  >
                    Update Tournament
                  </button>
                  <button
                    className="register-btn"
                    onClick={() => handleDelete(tournament.id)}
                  >
                    Delete Tournament
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {showPopup && (
          <div className="popup-overlay">
            <div className="popup-content">
              <h2>{editingTournamentId ? "Update Tournament" : "Create Tournament"}</h2>

              <div className="form-scroll-container">
                <label>
                  Tournament Name:
                  <input
                    value={tournamentName}
                    onChange={(e) => setTournamentName(e.target.value)}
                    placeholder="Enter tournament name"
                  />
                </label>

                <label>
                  Organizer:
                  <input
                    value={organizer}
                    onChange={(e) => setOrganizer(e.target.value)}
                    placeholder="Enter organizer name"
                  />
                </label>
                  select Sports:
                <select
                  value={selectedSportId}
                  onChange={(e) => setSelectedSportId(e.target.value)}
                >
                  <option value="">Select Sport</option>
                  {availableSports.map((sport) => (
                    <option key={sport.id} value={sport.id}>
                      {sport.name}
                    </option>
                  ))}
                </select>


                <label>
                  Court:
                  <select
                    value={selectedCourtId}
                    onChange={(e) => setSelectedCourtId(e.target.value)}
                  >
                    <option value="">Select Court</option>
                    {courts
                      .filter((court) => court.sportname === sportsList.find(s => s.id === selectedSportId)?.name)
                      .map((court) => (
                        <option key={court.id} value={court.id}>
                          {court.title} ({court.sportname})
                        </option>
                      ))}

                  </select>
                </label>


                <label>
                  Entry Fee:
                  <input
                    type="number"
                    value={entryFee}
                    onChange={(e) => setEntryFee(e.target.value)}
                    placeholder="Enter entry fee"
                  />
                </label>

                <label>
                  Total Teams:
                  <input
                    type="number"
                    value={totalTeams}
                    onChange={(e) => setTotalTeams(e.target.value)}
                    placeholder="Enter total teams"
                  />
                </label>

                <label>
                  Phone:
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter contact number"
                  />
                </label>

                <label>
                  Details:
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Enter tournament details"
                  />
                </label>

                <label>
                  Register Ends:
                  <input
                    type="date"
                    value={registerEnds}
                    onChange={(e) => setRegisterEnds(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </label>

                <label>
                  Game Day:
                  <input
                    type="date"
                    value={gameDay}
                    onChange={(e) => setGameDay(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </label>

                <label>
                  Game End Day:
                  <input
                    type="date"
                    value={gameEndDay}
                    onChange={(e) => setGameEndDay(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </label>
              </div>

              <div className="popup-buttons">
                <button className="tournament-btn" onClick={handleCreate}>
                  {editingTournamentId ? "Update" : "Submit"}
                </button>
                <button
                  className="tournament-btn"
                  onClick={() => {
                    setShowPopup(false);
                    setEditingTournamentId(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {showRegisteredTeamsPopup && (
          <div className="popup-overlay">
            <div className="popup-content">
              <h2>Registered Teams</h2>
              {registeredTeams.length === 0 ? (
                <p>No teams registered yet.</p>
              ) : (
                <div className="popup-team-list">
                  <ul>
                    {registeredTeams.map((team) => (
                      <li className="popup-team-lists" key={team.id}>
                        Team Name: <strong>{team.teamName}</strong>
                        <br />
                        Phone: {team.phone}
                        <br />
                        Registered By: {team.user?.name ?? "N/A"}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <button
                className="register-btn"
                onClick={() => setShowRegisteredTeamsPopup(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Tournament;