import React, { useEffect, useState,useContext } from "react";
import { useNavigate } from "react-router-dom";
import Nav1 from "../../../defaultPage/userNavigation";
import apiRequest from "../../../lib/apiReq";
import "./userHistory.css";
import { AuthContext } from "../../context/AuthContext";

function History() {
  const { currentUser } = useContext(AuthContext);
  const [booking, setBooking] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
          if (currentUser.role!=="user") {
              navigate("/login");
          }
      }, [currentUser, navigate]);

  useEffect(() => {
    
      const fetchBookings = async () => {
        try {
          const response = await apiRequest.get(`/book/getbookingbyuserid`);
          setBooking(response.data.bookings);
        } catch (error) {
          console.error("Error fetching booking:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchBookings();
    
  }, []);

  if (loading) {
    return (
      <div className="book-containers">
        <Nav1 />
        <div className="loading-state">Loading your booking history...</div>
      </div>
    );
  }

  if (booking.length === 0) {
    return (
      <div className="book-containers">
        <Nav1 />
        <div className="empty-state">No bookings found!</div>
      </div>
    );
  }

  return (
    <div className="book-containers">
      <Nav1 />
      <div className="history-content">
        <h2 className="history-title">Your Booking History</h2>
        <ul className="booking-list">
          {booking.map((booking) => (
            <li
              key={booking.id}
              className="booking-item"
              onClick={() => {
                if (booking.paymentMethod === "cash" || booking.paymentStatus === "success") {
                  navigate(`/user/result/${booking.id}`);
                } else if (booking.paymentStatus === "PENDING" || booking.status === "PENDING") {
                  navigate(`/user/confirmation/${booking.id}`);
                }
              }}
            >
              <p><strong>Venue:</strong> {booking.venue?.title || "N/A"}</p>
              <p><strong>Court:</strong> {booking.court?.title || "N/A"}</p>
              <p><strong>Date:</strong> {new Date(booking.date).toLocaleDateString()}</p>
              <p><strong>Time:</strong> {`${booking.starting_hour}:00 - ${booking.ending_hour}:00`}</p>
              <p data-status={booking.paymentStatus}><strong>Payment:</strong> {booking.paymentStatus}</p>
              <p><strong>Method:</strong> {booking.paymentMethod}</p>
              <p data-status={booking.status}><strong>Status:</strong> {booking.status}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default History;