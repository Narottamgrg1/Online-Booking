import React, { useEffect, useState,useContext } from "react";
import DataTable from "react-data-table-component";
import ManagerNav from "../../../defaultPage/ManagerNav";
import apiRequest from "../../../lib/apiReq";
import "./managerBook.css";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

// Convert UTC date to Nepal Time (UTC+5:45)
const formatNepalDate = (utcDate) => {
  const date = new Date(utcDate);
  const nepalOffset = 5.75 * 60; // in minutes
  const localTime = new Date(date.getTime() + nepalOffset * 60000);
  return localTime.toLocaleDateString("en-GB"); // DD/MM/YYYY format
};

const Book = () => {
  const { currentUser } = useContext(AuthContext);
  const [venue, setVenue] = useState(null);
  const [selectedSport, setSelectedSport] = useState("");
  const [selectedCourt, setSelectedCourt] = useState("all");
  const [filteredCourts, setFilteredCourts] = useState([]);
  const [bookings, setBookings] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
              if (currentUser.role!=="manager") {
                  navigate("/login");
              }
          }, [currentUser, navigate]);

  // Load venue data
  useEffect(() => {
    const venueData = JSON.parse(localStorage.getItem("venue_data"));
    if (venueData && venueData.id) {
      setVenue(venueData);
    } else {
      alert("Venue data not found. Please login again.");
    }
  }, []);

  // Fetch bookings when venue is set
  useEffect(() => {
    if (!venue?.id) return;

    // Fetch immediately
    fetchBookings(selectedCourt);

    // Set up interval
    const interval = setInterval(() => {
      fetchBookings(selectedCourt);
    }, 3000);

    return () => clearInterval(interval); // cleanup
  }, [selectedCourt, venue?.id]);


  // Change sport and reset courts
  const handleSportChange = (sport) => {
    setSelectedSport(sport);
    setSelectedCourt("all");
    if (venue?.courts?.length) {
      const filtered = venue.courts.filter(court => court.sportname === sport);
      setFilteredCourts(filtered);
    }
    fetchBookings("all");
  };

  // Change court and refetch
  const handleCourtChange = (courtId) => {
    setSelectedCourt(courtId);
    fetchBookings(courtId);
  };

  const fetchBookings = async (courtId = "all") => {
    if (!venue?.id) return;
    try {
      const res = await apiRequest.post(`/book/getBooking/${venue.id}`, {
        courtId,
      });

      // Sort by createdAt descending (most recent first)
      const sortedBookings = res.data.sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      setBookings(sortedBookings);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      alert("Failed to load bookings.");
    }
  };


  // Update status to confirmed or cancelled
  const handleStatusUpdate = async (bookingId, status) => {
    try {
      await apiRequest.put(`/book/verify/${venue.id}`, {
        bookingId,
        status,
      });
      fetchBookings(selectedCourt);  // Refresh bookings after update
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update booking status.");
    }
  };

  const columns = [
    { name: "Name", selector: (row) => row.user.name },
    { name: "Phone", selector: (row) => row.user.Phone },
    { name: "Date", selector: (row) => formatNepalDate(row.date), sortable: true },
    { name: "Time", selector: (row) => `${row.starting_hour}:00 - ${row.ending_hour}:00` },
    { name: "Court", selector: (row) => row.court.title },
    { name: "Status", selector: (row) => row.status },
    {
      name: "Actions",
      cell: (row) => (
        <div className="action-buttons">
          <button
            className="confirm-btn"
            onClick={() => handleStatusUpdate(row.id, "CONFIRMED")}
            disabled={row.status === "CONFIRMED" || row.status === "COMPLETED"}
          >
            Confirm
          </button>
          <button
            className="cancel-btn"
            onClick={() => handleStatusUpdate(row.id, "CANCELLED")}
            disabled={row.status === "CANCELLED" || row.status === "COMPLETED"}
          >
            Cancel
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="manager-container">
      <ManagerNav />
      <div className="content">
        <h2>Bookings</h2>

        {venue && (
          <>
            <select value={selectedSport} onChange={(e) => handleSportChange(e.target.value)}>
              <option value="" disabled>Select Sport</option>
              {venue.sports.map((sport, index) => (
                <option key={index} value={sport}>{sport}</option>
              ))}
            </select>

            {selectedSport && (
              <select value={selectedCourt} onChange={(e) => handleCourtChange(e.target.value)}>
                <option value="all">All Courts</option>
                {filteredCourts.map((court) => (
                  <option key={court.id} value={court.id}>{court.title}</option>
                ))}
              </select>
            )}
          </>
        )}

        <DataTable
          columns={columns}
          data={bookings}
          pagination
          highlightOnHover
          responsive
        />
      </div>
    </div>
  );
};

export default Book;