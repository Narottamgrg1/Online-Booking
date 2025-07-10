import React, { useEffect, useState,useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import apiRequest from "../../../lib/apiReq";
import Nav1 from "../../../defaultPage/userNavigation";
import "./userResult.css"; // Import the CSS file
import ProgressBar from "../../../defaultPage/ProgressBar";
import { AuthContext } from "../../context/AuthContext";

function BookResult() {
  const { id } = useParams();
  const { currentUser } = useContext(AuthContext);
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
          if (currentUser.role!=="user") {
              navigate("/login");
          }
      }, [currentUser, navigate]);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await apiRequest.get(`/book/getbookingbyid/${id}`);
        setBooking(res.data);
      } catch (err) {
        setError("❌ Failed to fetch booking details. Please try again later.");
      }
    };
    if (id) fetchBooking();
  }, [id]);

  const getStatusClass = (status) => {
    return status.toLowerCase() === "confirmed" ? "status-confirmed" : "status-pending";
  };

  const getPaymentStatusClass = (status) => {
    return status.toLowerCase() === "paid" ? "payment-paid" : "payment-pending";
  };

  return (
    <div>
      <Nav1 />
      <ProgressBar currentStep={"Result"}/>
      <div className="booking-result-container">
        <h2 className="booking-result-header">Booking Details</h2>
        {error && <p className="error-text">{error}</p>}
        {booking ? (
          <>
            <div className="booking-details">
              <div className="booking-detail-item">
                <strong>Venue:</strong> {booking.venue?.title}
              </div>
              <div className="booking-detail-item">
                <strong>Address:</strong> {booking.venue?.address}, {booking.venue?.city}
              </div>
              <div className="booking-detail-item">
                <strong>Sport:</strong> {booking.court?.sportname}
              </div>
              <div className="booking-detail-item">
                <strong>Court:</strong> {booking.court?.title}
              </div>
              <div className="booking-detail-item">
                <strong>Date:</strong> {new Date(booking.date).toLocaleDateString()}
              </div>
              <div className="booking-detail-item">
                <strong>Time Slot:</strong> {booking.starting_hour}:00 - {booking.ending_hour}:00
              </div>
              <div className="booking-detail-item">
                <strong>Duration:</strong> {booking.duration} hour{booking.duration > 1 ? "s" : ""}
              </div>
              <div className="booking-detail-item">
                <strong>Status:</strong> 
                <span className={`booking-status ${getStatusClass(booking.status)}`}>
                  {booking.status}
                </span>
              </div>
              <div className="booking-detail-item">
                <strong>Payment Status:</strong> 
                <span className={`payment-status ${getPaymentStatusClass(booking.paymentStatus)}`}>
                  {booking.paymentStatus}
                </span>
              </div>
              <div className="booking-detail-item">
                <strong>Payment Method:</strong> {booking.paymentMethod}
              </div>
            </div>
            <div className="price-highlight">
              Total Price: Rs. {booking.price}
            </div>
          </>
        ) : (
          !error && <p className="loading-text">Loading booking details...</p>
        )}
      </div>
    </div>
  );
}

export default BookResult;