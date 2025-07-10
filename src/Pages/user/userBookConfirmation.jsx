import React, { useEffect, useState,useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Nav1 from "../../../defaultPage/userNavigation";
import ProgressBar from "../../../defaultPage/ProgressBar";
import apiRequest from "../../../lib/apiReq";
import "./userBookConfirmation.css";
import { AuthContext } from "../../context/AuthContext";

function BookingConfirmation() {
  const { id } = useParams();
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loyalty, setLoyalty] = useState(null)
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [canceling, setCanceling] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);

  useEffect(() => {
          if (currentUser.role!=="user") {
              navigate("/login");
          }
      }, [currentUser, navigate]);

  useEffect(() => {
    let intervalId;

    const fetchBooking = async () => {
      try {
        const res = await apiRequest.get(`/book/getbookingbyid/${id}`);
        setBooking(res.data);
      } catch (err) {
        setError("❌ Failed to fetch booking details.");
      }
    };

    if (id) {
      fetchBooking(); // Initial fetch
      intervalId = setInterval(fetchBooking, 3000); // Repeat every 3 seconds
    }

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [id]);


  useEffect(() => {
    const fetchLoyalty = async () => {
      try {
        if (!booking?.venue?.id) return;
        const res = await apiRequest.get(`/loyalty/getloyalty/${booking.venue.id}`);
        const card = res.data.card;

        // Check if eligible for redemption
        if (card?.points >= card?.venue?.loyaltyPoint) {
          card.status = "ready to redeem";
        }

        setLoyalty(card);
      } catch (err) {
        setError("❌ Failed to fetch loyalty details.");
      }
    };
    fetchLoyalty();
  }, [booking]);


  const handleCancelBooking = async () => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;

    setCanceling(true);

    try {
      const res = await apiRequest.put(`/book/cancel/${id}`);
      setBooking(prev => ({ ...prev, status: "cancelled" }));
      setSuccessMessage("✅ Booking cancelled successfully.");

      setTimeout(() => {
        navigate(`/user/booknow/${booking.venue.id}`);
      }, 1000);
    } catch (err) {
      setError("❌ Failed to cancel booking.");
    } finally {
      setCanceling(false);
    }
  };

  const handleProceedToPayment = async () => {
    if (!window.confirm("Are you sure you want to proceed to payment?")) return;
    try {
      if (!booking) return;

      setPaymentLoading(true);

      const res = await apiRequest.post('/payment/initialize-khalti', {
        bookingId: booking.id,
        totalPrice: booking.price,
        website_url: window.location.origin,
      });

      const { payment } = res.data;

      if (payment?.payment_url) {
        window.location.href = payment.payment_url;
      } else {
        setError('❌ Failed to initiate Khalti payment.');
      }
    } catch (err) {
      console.error('Error proceeding to payment:', err);
      setError('❌ Failed to proceed to payment.');
      setPaymentLoading(false);
    }
  };

  const handleCashPayment = async () => {
    if (!window.confirm("Are you sure you want to pay with cash?")) return;
    try {
      const res = await apiRequest.put(`/payment/paymentoncash/${booking.id}`, {
        paymentMethod: "cash"
      });
      alert("✅ Cash payment recorded successfully.");
      setBooking(prev => ({
        ...prev,
        paymentMethod: "cash",
      }));
      navigate(`/user/result/${id}`);
    } catch (err) {
      console.error(err);
      alert("❌ Failed to record cash payment.");
    }
  };

  const handleGoToResult = () => {
    navigate(`/user/result/${id}`);
  };

  const handleBackToHome = () => {
    navigate('/user/home');
  };

  const handleRedeem = async () => {
    if (!window.confirm("Are you sure you want to redeem your loyalty points for this booking?")) return;
    try {
      const res = await apiRequest.put(`/loyalty/redeemloyalty/${booking.venue.id}/${booking.id}`);
      alert("🎉 Booking redeemed with loyalty points!");
      setBooking(prev => ({
        ...prev,
        paymentMethod: "loyalty",
        paymentStatus: "success",
      }));
      navigate(`/user/result/${id}`);
    } catch (err) {
      console.error(err);
      alert("❌ Failed to redeem loyalty points.");
    }
  };


  return (
    <div className="book-container">
      <Nav1 />
      <ProgressBar currentStep={"Confirmation"} />

      <div className="booking-details-card">
        <h2>Booking Confirmation</h2>
        {error && <p className="error">{error}</p>}
        {successMessage && <p className="success">{successMessage}</p>}
        {booking ? (
          <>
            <p><strong>Venue:</strong> {booking.venue?.title}</p>
            <p><strong>Address:</strong> {booking.venue?.address}, {booking.venue?.city}</p>
            <p><strong>Sport:</strong> {booking.court?.sportname}</p>
            <p><strong>Court:</strong> {booking.court?.title}</p>
            <p><strong>Date:</strong> {new Date(booking.date).toLocaleDateString()}</p>
            <p><strong>Start Time:</strong> {booking.starting_hour}:00 - {booking.ending_hour}:00</p>
            <p><strong>Duration:</strong> {booking.duration} hour{booking.duration > 1 ? "s" : ""}</p>
            <p><strong>Status:</strong> {booking.status}</p>
            <p><strong>Payment Status:</strong> {booking.paymentStatus}</p>
            <p><strong>Payment Method:</strong> {booking.paymentMethod}</p>
            <p><strong>Price:</strong> Rs. {booking.price}</p>
            {loyalty ? (
              <>
                <p><strong>Loyalty Points:</strong> {loyalty.points}-{loyalty.venue.loyaltyPoint}</p>
                <p>
                  <strong>Loyalty Status:</strong>{" "}
                  {loyalty.status === "ready to redeem" ? (
                    <span className="ready-status">🎁 Ready to Redeem</span>
                  ) : (
                    loyalty.status
                  )}
                </p>

              </>
            ) : (
              <p><strong>Loyalty:</strong> No loyalty record found for this venue.</p>
            )}

            {booking.status === "PENDING" && (
              <p className="waiting">Booking is pending. Please wait for confirmation...</p>
            )}

            {booking.status !== "cancelled" && !canceling && (
              <div className="button-group">
                {booking.paymentStatus !== "success" && booking.paymentMethod !== "cash" ? (
                  <>
                    <button className="cancel-btn" onClick={handleCancelBooking}>
                      Cancel Booking
                    </button>
                    {booking.status === "CONFIRMED" && (
                      loyalty && loyalty.points >= loyalty.venue.loyaltyPoint ? (
                        <button className="payment-btn" onClick={handleRedeem}>
                          Redeem Loyalty
                        </button>
                      ) : (
                        <button className="payment-btn" onClick={() => setShowPaymentOptions(true)}>
                          {paymentLoading ? 'Processing...' : 'Proceed to Payment'}
                        </button>
                      )
                    )}

                  </>
                ) : (
                  <>
                    <button className="cancel-btn" onClick={handleBackToHome}>
                      Back to Home
                    </button>
                    <button className="payment-btn" onClick={handleGoToResult}>
                      Go to Result
                    </button>
                  </>
                )}
              </div>
            )}

            {canceling && <p className="loading-text">Canceling your booking...</p>}
          </>
        ) : (
          <p className="loading-text">Loading booking details...</p>
        )}
      </div>

      {/* Payment Method Modal */}
      {showPaymentOptions && (
        <div className="payment-modal">
          <div className="payment-modal-content">
            <h3>Select Payment Method</h3>
            <button onClick={() => {
              setShowPaymentOptions(false);
              handleProceedToPayment();
            }} disabled={paymentLoading}>
              {paymentLoading ? 'Processing...' : 'Pay with Khalti'}
            </button>
            <button onClick={() => {
              setShowPaymentOptions(false);
              alert("eSewa integration coming soon!");
            }}>
              Pay with eSewa
            </button>
            <button onClick={async () => {
              setShowPaymentOptions(false);
              await handleCashPayment();
            }}>
              Pay with Cash
            </button>
            <button className="close-btn" onClick={() => setShowPaymentOptions(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BookingConfirmation;