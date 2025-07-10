import React, { useState, useEffect, useContext } from "react";
import { useNavigate,Link } from "react-router-dom";
import ManagerNav from "../../../defaultPage/ManagerNav";
import "./managerCourt.css";
import Map from "../../../defaultPage/map";
import apiRequest from "../../../lib/apiReq";
import { AuthContext } from "../../context/AuthContext";

const Court = () => {
  
  const [venue, setVenue] = useState(null); // State to hold venue data
  const [reviews, setReviews] = useState([]);
  const [modalContent, setModalContent] = useState(null);
  const navigate = useNavigate();
  const [error,setError]=useState("");
  const { currentUser } = useContext(AuthContext);
  

  useEffect(() => {
              if (currentUser.role!=="manager") {
                  navigate("/login");
              }
          }, [currentUser, navigate]);
 

  // Fetch venue data from localStorage on component mount
  useEffect(() => {
  const fetchVenueAndReviews = async () => {
    const storedVenue = JSON.parse(localStorage.getItem("venue_data"));
    if (storedVenue) {
      setVenue(storedVenue); // Set venue data

      try {
        const reviewResponse = await apiRequest.get(`/review/getReviews/${storedVenue.id}`);
        setReviews(reviewResponse.data.reviews || []);
      } catch (err) {
        console.error("Failed to fetch reviews", err);
      }
    } else {
      setVenue(null);
    }
  };

  fetchVenueAndReviews();
}, []);


  const openModal = (content) => {
    setModalContent(content);
  };

  const closeModal = () => {
    setModalContent(null);
  };

  const handleEditClick = () => {
    navigate("/manager/add"); // Navigate to the "add" page when the button is clicked
  };

  const handleDeleteCourt = async () => {
    try {
      const confirmDelete = window.confirm("Are you sure you want to delete this venue?");
      if (!confirmDelete) return; // Cancel delete if user clicks "No"
      
      await apiRequest.delete(`/venue/delete/${venue.id}`);
      
      // Update localStorage instead of removing it
      localStorage.setItem("venue_data", JSON.stringify(null));
      setVenue(null); 
  
      alert("Venue deleted successfully.");
  
    } catch (error) {
      console.error(error);
      setError(error.response?.data?.message || "Failed to delete court.");
    }
  };
  

  return (
    <div className="main-court-container">
      <ManagerNav />

      <div className="venue-court-container">
        <h1>Your Court</h1>

        {venue ? (
          <>
            <div className="edit-btn-container">
              <Link to="/manager/update">
              <button className="edit-btn" >
                Edit Venue
              </button>
              </Link>
            </div>

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

            <button className="info-btn" onClick={() => openModal("sports")}>
              Courts & Sports
            </button>

            <button className="info-btn" onClick={() => openModal("courts")}>
              View Courts & Pricing
            </button>
            <button className="info-btn" onClick={() => openModal("services")}>
              View Services
            </button>
            <button className="info-btn" onClick={() => openModal("policies")}>
              View Policies
            </button>
            <button className="info-btn" onClick={() => openModal("timings")}>
              View Timings
            </button>
            <button className="info-btn" onClick={() => openModal("reviews")}>Review & Ratings</button>

            {/* Modal */}
            {modalContent && (
              <div className="modal">
                <div className="modal-content">
                  <span className="closing-btn" onClick={closeModal}>
                    &times;
                  </span>
                  <h2>
                    {modalContent === "sports" && "Courts & Sports"}
                    {modalContent === "courts" && "Courts & Pricing"}
                    {modalContent === "services" && "Services"}
                    {modalContent === "policies" && "Policies"}
                    {modalContent === "timings" && "Timings"}
                  </h2>

                  {/* Display respective content */}

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
                          <strong>{court.title}:</strong> Rs. {court.price_per_hour} per hour, {court.sportname}
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

            <div className="delete-court-container">
              <button className="delete-btn" onClick={handleDeleteCourt}>
                Delete Court
              </button>

            </div>

          </>
        ) : (
          <div className="no-data-container">
            <h2>No venue details available. Please add your venue details.</h2>
            <button className="edit-btn" onClick={handleEditClick}>
              Add Venue
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Court;
