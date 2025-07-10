import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiRequest from "../../../lib/apiReq";
import { AuthContext } from "../../context/AuthContext";
import AdminNav from "../../../defaultPage/AdminNav";
import "./adminVenue.css"; // your CSS file

const AdminVenues = () => {
  const [venues, setVenues] = useState([]);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedVenues, setSelectedVenues] = useState([]);
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
                  if (currentUser.role!=="admin") {
                      navigate("/login");
                  }
              }, [currentUser, navigate]);

  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const response = await apiRequest.get("/venue/getVenuesforadmin");
        if (response.data) {
          setVenues(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch venues:", error);
      }
    };

    fetchVenues();
  }, []);

  const toggleSelectMode = () => {
    setSelectMode(!selectMode);
    setSelectedVenues([]);
  };

  const handleCheckboxChange = (venueId) => {
    setSelectedVenues((prev) =>
      prev.includes(venueId)
        ? prev.filter((id) => id !== venueId)
        : [...prev, venueId]
    );
  };

  const handleDelete = async () => {
    if (selectedVenues.length === 0) return alert("No venues selected!");

    if (!window.confirm(`Are you sure you want to delete ${selectedVenues.length} venue(s)?`)) {
      return;
    }

    try {
      await apiRequest.post("/venue/admin", { ids: selectedVenues });
      setVenues((prev) => prev.filter((venue) => !selectedVenues.includes(venue.id)));
      setSelectedVenues([]);
      setSelectMode(false);
    } catch (error) {
      console.error("Failed to delete venues:", error);
    }
  };

  const handleCardClick = (venueId) => {
  if (selectMode) {
    handleCheckboxChange(venueId);
  } else {
    navigate(`/admin/venues/venueinfo/${venueId}`);
  }
};


  const handleApprove = async (venueId) => {
    try {
      const response = await apiRequest.put(`/venue/adminaproval/${venueId}`, {
        status: "approved",
      });
      alert(response.data.message);
      setVenues((prev) =>
        prev.map((venue) =>
          venue.id === venueId ? { ...venue, status: "approved" } : venue
        )
      );
    } catch (error) {
      console.error("Failed to approve venue:", error);
      alert("Failed to approve venue.");
    }
  };

  const handleDecline = async (venueId) => {
    try {
      const response = await apiRequest.put(`/venue/adminaproval/${venueId}`, {
        status: "declined",
      });
      alert(response.data.message);
      setVenues((prev) =>
        prev.map((venue) =>
          venue.id === venueId ? { ...venue, status: "declined" } : venue
        )
      );
    } catch (error) {
      console.error("Failed to decline venue:", error);
      alert("Failed to decline venue.");
    }
  };


  return (
    <div className="admin-container">
      <AdminNav />
      <div className="admin-cards-header">
        <h2>Venues</h2>
         <p>Total Venues: {venues.length}</p>
        
      </div>

      <div className="admin-cards-container">
        {venues.map((venue) => (
          <div
            key={venue.id}
            className={`admin-card ${selectedVenues.includes(venue.id) ? "selected" : ""}`}
            onClick={() => handleCardClick(venue.id)}
          >
            
            {venue.imgs && venue.imgs.length > 0 && (
              <img
                src={venue.imgs[0]}
                alt={venue.title}
                className="admin-card-img"
              />
            )}
            <div className="admin-card-body">
              <h3>{venue.title}</h3>
              <p>{venue.address}, {venue.city}</p>
              {venue.status && (
                <p className={`status ${venue.status}`}>Status: {venue.status}</p>
              )}
              <div className="admin-card-actions">
                <button
                  className="approve-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleApprove(venue.id);
                  }}
                  disabled={venue.status === "approved"}
                  style={{
                    backgroundColor: venue.status === "approved" ? "#d3d3d3" : "#4CAF50",
                    cursor: venue.status === "approved" ? "not-allowed" : "pointer",
                  }}
                >
                  Approve
                </button>

                <button
                  className="decline-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDecline(venue.id);
                  }}
                  disabled={venue.status === "declined"}
                  style={{
                    backgroundColor: venue.status === "declined" ? "#d3d3d3" : "#f44336",
                    cursor: venue.status === "declined" ? "not-allowed" : "pointer",
                  }}
                >
                  Decline
                </button>


              </div>
            </div>
          </div>
        ))}
      </div>

      {selectMode && (
        <div className="delete-footer">
          <button
            className="confirm-delete-button"
            onClick={handleDelete}
            disabled={selectedVenues.length === 0}
          >
            Confirm Delete ({selectedVenues.length})
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminVenues;
