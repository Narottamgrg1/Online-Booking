import React, { useEffect, useState,useContext } from "react";
import ManagerNav from "../../../defaultPage/ManagerNav";
import "./managerSchedule.css"
import apiRequest from "../../../lib/apiReq";
import { FiCalendar, FiClock, FiMapPin, FiUser, FiPhone, FiDollarSign } from 'react-icons/fi';
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const formatNepalDate = (utcDate) => {
    const date = new Date(utcDate);
    const nepalOffset = 5.75 * 60; // in minutes
    const localTime = new Date(date.getTime() + nepalOffset * 60000);
    return localTime.toLocaleDateString("en-GB"); // DD/MM/YYYY format
};

const BookSchedule = () => {
    const { currentUser } = useContext(AuthContext);
    const [venue, setVenue] = useState(null);
    const [selectedSport, setSelectedSport] = useState("");
    const [selectedCourt, setSelectedCourt] = useState("all");
    const [selectedStatus, setSelectedStatus] = useState("all");
    const [filteredCourts, setFilteredCourts] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
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
        if (venue?.id) {
            fetchBookings("all");
        }
    }, [venue]);

    const handleSportChange = (sport) => {
        setSelectedSport(sport);
        setSelectedCourt("all");
        if (venue?.courts?.length) {
            const filtered = venue.courts.filter(court => court.sportname === sport);
            setFilteredCourts(filtered);
        }
        fetchBookings("all");
    };

    const handleCourtChange = (courtId) => {
        setSelectedCourt(courtId);
        fetchBookings(courtId, selectedStatus);
    };

    const handleStatusChange = (status) => {
        setSelectedStatus(status);
        fetchBookings(selectedCourt, status);
    };

    const fetchBookings = async (courtId = selectedCourt, status = selectedStatus) => {
        if (!venue?.id) return;
        setIsLoading(true);
        try {
            const res = await apiRequest.post(`/book/getBooking/${venue.id}`, {
                courtId,
                status,
            });

            const sortedBookings = res.data.sort((a, b) => {
                return new Date(b.createdAt) - new Date(a.createdAt);
            });

            setBookings(sortedBookings);
        } catch (err) {
            console.error("Error fetching bookings:", err);
            alert("Failed to load bookings.");
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'CONFIRMED':
                return '#4CAF50'; // Green
            case 'COMPLETED':
                return '#FFC107'; // Amber
            case 'CANCELLED':
                return '#F44336'; // Red
            case 'PENDING':
                return '#9E9E9E'; //
            default:
                return '#9E9E9E'; // Grey
        }
    };

    const getPaymentStatusColor = (status) => {
        switch (status) {
            case 'success':
                return '#4CAF50'; // Green
            case 'PENDING':
                return '#9E9E9E'; // 
            case 'failed':
                return '#F44336'; // Red
            default:
                return '#9E9E9E'; // Grey
        }
    };

    const handlePaymentUpdate = async (bookingId) => {
        const confirmed = window.confirm("Are you sure you want to mark this payment as successful?");
        if (!confirmed) return;
        try {
            await apiRequest.put(`/payment/updatepayment/${bookingId}`, {
                paymentStatus: "success"
            });
            fetchBookings(selectedCourt, selectedStatus);
        } catch (err) {
            console.error("Failed to update payment status:", err);
            alert("❌ Could not update payment status.");
        }
    };

    return (
        <div className="manager-container">
            <ManagerNav />
            <div className="manager-schedule-container">
                <div className="schedule-header">
                    <h2>Bookings Schedule</h2>
                    <div className="filter-container">
                        {venue && (
                            <>
                                <div className="filter-group">
                                    <label>Sport</label>
                                    <select
                                        value={selectedSport}
                                        onChange={(e) => handleSportChange(e.target.value)}
                                        disabled={!venue.sports?.length}
                                    >
                                        <option value="" disabled>Select Sport</option>
                                        {venue.sports?.map((sport, index) => (
                                            <option key={index} value={sport}>{sport}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="filter-group">
                                    <label>Court</label>
                                    <select
                                        value={selectedCourt}
                                        onChange={(e) => handleCourtChange(e.target.value)}
                                        disabled={!filteredCourts.length}
                                    >
                                        <option value="all">All Courts</option>
                                        {filteredCourts.map((court) => (
                                            <option key={court.id} value={court.id}>{court.title}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="filter-group">
                                    <label>Status</label>
                                    <select value={selectedStatus} onChange={(e) => handleStatusChange(e.target.value)}>
                                        <option value="all">All Status</option>
                                        <option value="PENDING">Pending</option>
                                        <option value="CONFIRMED">Confirmed</option>
                                        <option value="CANCELLED">Cancelled</option>
                                        <option value="COMPLETED">Completed</option>
                                    </select>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {isLoading ? (
                    <div className="loading-spinner">
                        <div className="spinner"></div>
                        <p>Loading bookings...</p>
                    </div>
                ) : (
                    <div className="bookings-grid">
                        {bookings.length > 0 ? (
                            bookings.map((booking) => (
                                <div key={booking.id} className="booking-card">
                                    <div className="booking-header">
                                        <div className="user-info">
                                            <FiUser className="icon" />
                                            <h3>{booking.user.name}</h3>
                                        </div>
                                        <div className="phone">
                                            <FiPhone className="icon" />
                                            <span>{booking.user.Phone || 'N/A'}</span>
                                        </div>
                                    </div>

                                    <div className="booking-details">
                                        <div className="detail-row">
                                            <FiCalendar className="icon" />
                                            <span>{formatNepalDate(booking.date)}</span>
                                        </div>
                                        <div className="detail-row">
                                            <FiClock className="icon" />
                                            <span>{`${booking.starting_hour}:00 - ${booking.ending_hour}:00`}</span>
                                        </div>
                                        <div className="detail-row">
                                            <FiMapPin className="icon" />
                                            <span>{booking.court.title}</span>
                                        </div>
                                    </div>

                                    <div className="booking-footer">
                                        <div className="status-badges">
                                            <div
                                                className="status-badge"
                                                style={{ backgroundColor: getStatusColor(booking.status) }}
                                            >
                                                {booking.status}
                                            </div>
                                            <div
                                                className="payment-badge"
                                                style={{ backgroundColor: getPaymentStatusColor(booking.paymentStatus) }}
                                            >
                                                <FiDollarSign className="icon" />
                                                {booking.paymentStatus} ({booking.paymentMethod})
                                            </div>
                                        </div>

                                        {booking.paymentMethod === "cash" && booking.paymentStatus !== "success" && (
                                            <button
                                                className="update-payment-btn"
                                                onClick={() => handlePaymentUpdate(booking.id)}
                                            >
                                                Mark as Paid
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="no-bookings">
                                <p>No bookings found for the selected criteria.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookSchedule;