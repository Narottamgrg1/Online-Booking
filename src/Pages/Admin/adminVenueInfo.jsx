import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./adminVenueInfo.css";
import Map from "../../../defaultPage/map";
import apiRequest from "../../../lib/apiReq";
import AdminNav from "../../../defaultPage/AdminNav";
import { AuthContext } from "../../context/AuthContext";

const Court = () => {
  const { id } = useParams();
  const [venue, setVenue] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [modalContent, setModalContent] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Placeholder currentUser (replace with actual auth context logic)
  const { currentUser } = useContext(AuthContext); // Replace with actual logged-in user ID

  useEffect(() => {
                  if (currentUser.role!=="admin") {
                      navigate("/login");
                  }
              }, [currentUser, navigate]);

  useEffect(() => {
    const fetchVenue = async () => {
      try {
        const res = await apiRequest.get(`/venue/getvenue/${id}`);
        setVenue(res.data);

        const reviewResponse = await apiRequest.get(`/review/getReviews/${id}`);
        setReviews(reviewResponse.data.reviews);
      } catch (err) {
        setError("❌ Failed to load venue");
      }
    };
    if (id) fetchVenue();
  }, [id]);

  const openModal = (content) => {
    setModalContent(content);
  };

  const closeModal = () => {
    setModalContent(null);
  };

  // Placeholder handlers
  const editReview = (review) => {
    alert(`Edit review with ID: ${review.id}`); // Replace with modal form or route
  };

  const deleteReview = async (reviewId) => {
    try {
      await apiRequest.delete(`/review/deleteReview/${reviewId}`);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (err) {
      alert("❌ Failed to delete review.");
    }
  };

  return (
    <div className="main-container">
      <AdminNav />
      <div className="venue-containers">
        <h1>Venue Court & Info</h1>

        {venue ? (
          <>
            <div className="venue-imgs">
              {venue.imgs.map((img, index) => (
                <img key={index} src={img} alt={`Court image ${index + 1}`} className="venue-image" />
              ))}
            </div>

            <div className="name-city">
              <h1>{venue.title}</h1>
              <h3>
                {venue.address}, {venue.city}
              </h3>
            </div>

            <button className="info-btn" onClick={() => openModal("sports")}>Courts & Sports</button>
            <button className="info-btn" onClick={() => openModal("courts")}>View Courts & Pricing</button>
            <button className="info-btn" onClick={() => openModal("services")}>View Services</button>
            <button className="info-btn" onClick={() => openModal("policies")}>View Policies</button>
            <button className="info-btn" onClick={() => openModal("timings")}>View Timings</button>
            <button className="info-btn" onClick={() => openModal("manager")}>Manager Info</button>
            <button className="info-btn" onClick={() => openModal("reviews")}>Review & Ratings</button>

            {/* Modal */}
            {modalContent && (
              <div className="modal">
                <div className="modal-content">
                  <span className="closing-btn" onClick={closeModal}>&times;</span>
                  <h2>
                    {{
                      sports: "Courts & Sports",
                      courts: "Courts & Pricing",
                      services: "Services",
                      policies: "Policies",
                      timings: "Timings",
                      manager: "Manager Info",
                      reviews: "Reviews & Ratings"
                    }[modalContent]}
                  </h2>

                  {/* Modal Content */}
                  {modalContent === "sports" && (
                    <div className="sports">
                      <ul>
                        {venue.sports.map((sport, index) => (
                          <li key={index}>{sport}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {modalContent === "courts" && (
                    <div className="court-price">
                      {venue.courts.map((court, index) => (
                        <p key={index}>
                          <strong>{court.title}:</strong> Rs. {court.price_per_hour} per hour ({court.sportname})
                        </p>
                      ))}
                    </div>
                  )}

                  {modalContent === "services" && (
                    <div className="services">
                      <ul>
                        {venue.details?.amenities?.map((service, index) => (
                          <li key={index}>{service}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {modalContent === "policies" && (
                    <div className="venue-policies">
                      <p>{venue.details?.venuepolicy}</p>
                    </div>
                  )}

                  {modalContent === "timings" && (
                    <div className="venue-timings">
                      {venue.details?.openinghours?.map((time, index) => (
                        <p key={index}>{time}</p>
                      ))}
                    </div>
                  )}

                  {modalContent === "manager" && (
                    <div className="manager-info">
                      <p><strong>Name:</strong> {venue.user?.name || "N/A"}</p>
                      <p><strong>Email:</strong> {venue.user?.email || "N/A"}</p>
                      <p><strong>Phone No:</strong> {venue.user?.Phone || "N/A"}</p>
                      <p><strong>Role:</strong> {venue.user?.role || "N/A"}</p>
                    </div>
                  )}

                  {modalContent === "reviews" && (
                    <div className="review-list">
                      {reviews.length > 0 ? (
                        reviews.map((reviewed) => (
                          <div key={reviewed.id} className="review-item">
                            <p><strong>Rating:</strong> {reviewed.rating} ⭐</p>
                            <p><strong>Review:</strong> {reviewed.review || "*No review text provided."}</p>
                            {reviewed.userId === currentUser.id && (
                              <>
                                <button className="review-btn" onClick={() => editReview(reviewed)}>Edit</button>
                                <button className="review-btn" onClick={() => deleteReview(reviewed.id)}>Delete</button>
                              </>
                            )}
                          </div>
                        ))
                      ) : (
                        <p>No reviews yet.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="venue-map">
              {venue.latitude && venue.longitude ? (
                <Map latitude={venue.latitude} longitude={venue.longitude} />
              ) : (
                <p>Location not available</p>
              )}
            </div>
          </>
        ) : (
          <div className="no-data-container">
            {error && <p>{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default Court;
