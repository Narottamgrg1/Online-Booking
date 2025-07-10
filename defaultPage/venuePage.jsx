import React, { useContext, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../src/Pages/user/userSingleCourt";
import Map from "./map";
import apiRequest from "../lib/apiReq";
import Availability from "./Availability";
import { AuthContext } from "../src/context/AuthContext";
import Nav from "./NavigationBar";


const Venue = () => {
    const [venue, setVenue] = useState(null);
    const [modalContent, setModalContent] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [challengeDetails, setChallengeDetails] = useState([]);
    const [newReview, setNewReview] = useState({ rating: 0, review: "" });
    const [editingReviewId, setEditingReviewId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchVenueData = async () => {
            try {
                const venueResponse = await apiRequest.get(`/venue/getvenue/${id}`);
                setVenue(venueResponse.data);

                const reviewResponse = await apiRequest.get(`/review/getReviews/${id}`);
                setReviews(reviewResponse.data.reviews);

                const challengeResponse = await apiRequest.get(`/challenge/getChallenge/${id}`);
                setChallengeDetails(challengeResponse.data.challenges);
            } catch (error) {
                setError(error.response?.data?.message || "Failed to fetch data.");
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchVenueData();
    }, [id]);

    const openModal = (content) => {
        setModalContent(content);
    };

    const closeModal = () => {
        setModalContent(null);
        setNewReview({ rating: 0, review: "" });
        setEditingReviewId(null);
    };

    const submitReview = async () => {
        // Validate rating and review text
        if (newReview.rating === 0) {
            alert("Rating must be greater than 0.");
            return;
        }

        if (newReview.review.trim() === "") {
            alert("Review text cannot be empty.");
            return;
        }

        try {
            const payload = {
                rating: parseInt(newReview.rating), // Ensure rating is integer
                review: newReview.review,
            };

            if (editingReviewId) {
                await apiRequest.put(`/review/updateReview/${editingReviewId}`, payload);
            } else {
                await apiRequest.post(`/review/postReviewAndRating/${id}`, payload);
            }

            // Fetch updated reviews
            const updated = await apiRequest.get(`/review/getReviews/${id}`);
            setReviews(updated.data.reviews);
            setNewReview({ rating: 0, review: "" });
            setEditingReviewId(null);
        } catch (error) {
            console.log("Review error:", error);
        }
    };


    const editReview = (review) => {
        setNewReview({ rating: review.rating, review: review.review });
        setEditingReviewId(review.id);
    };

    const deleteReview = async (reviewId) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this review?");
        if (!confirmDelete) return;

        try {
            await apiRequest.delete(`/review/deleteReview/${reviewId}`);
            setReviews(reviews.filter((r) => r.id !== reviewId));
        } catch (error) {
            console.log("Delete error:", error);
        }
    };


    const handleChallenge = async (challengeId) => {
        try {
            await apiRequest.put(`/challenge/updateChallenge/${challengeId}`);
            // Optional: refresh challenge list
            const challengeResponse = await apiRequest.get(`/challenge/getChallenge/${id}`);
            setChallengeDetails(challengeResponse.data.challenges);
        } catch (error) {
            console.log("Challenge error:", error);
        }
    };


    return (
        <div className="main-venue-container">
            <Nav />

            <div className="venue-info-container">
                {loading ? (
                    <p>Loading venue details...</p>
                ) : venue ? (
                    <>
                        <div className="name-city">
                            <h1>{venue.title}</h1>
                            <h3>{venue.address}, {venue.city}</h3>
                        </div>

                        <div className="button-container">
                            <button className="action-btn" onClick={() => openModal("availability")}>Challenge</button>
                            <button className="action-btn" onClick={() => {
                                
                                navigate(`/venue/availability/${id}`);

                            }}
                            >Availability</button>
                        </div>

                        <div className="venue-img">
                            {venue.imgs.map((img, index) => (
                                <img key={index} src={img} alt={`Court ${index}`} className="venue-image" />
                            ))}
                        </div>

                        <div className="info-btn-container">
                            <button className="info-btn" onClick={() => openModal("sports")}>Courts & Sports</button>
                            <button className="info-btn" onClick={() => openModal("courts")}>View Courts & Pricing</button>
                            <button className="info-btn" onClick={() => openModal("services")}>View Services</button>
                            <button className="info-btn" onClick={() => openModal("policies")}>View Policies</button>
                            <button className="info-btn" onClick={() => openModal("timings")}>View Timings</button>
                            <button className="info-btn" onClick={() => openModal("reviews")}>Review & Ratings</button>
                        </div>

                        {modalContent && (
                            <div className="modal">
                                <div className="modal-content">
                                    <span className="availa-close-btn" onClick={closeModal}>&times;</span>

                                    {modalContent === "reviews" ? (
                                        <div className="modal">
                                            <div className="review-modal">
                                                <span className="availa-close-btn" onClick={closeModal}>&times;</span>
                                                <h2 className="modal-title">Reviews</h2>

                                                <div className="review-list">
                                                    {reviews.length > 0 ? (
                                                        reviews.map((reviewed) => (
                                                            <div key={reviewed.id} className="review-item">
                                                                <p><strong>Rating:</strong> {reviewed.rating} ⭐</p>
                                                                <p><strong>Review:</strong> {reviewed.review || "*No review text provided."}</p>


                                                            </div>
                                                        ))
                                                    ) : (
                                                        <p>No reviews yet.</p>
                                                    )}
                                                </div>

                                                {/* Static form section */}
                                                <div className="review-form">
                                                    <h3>{editingReviewId ? "Edit Review" : "Post a Review"}</h3>
                                                    <label>Rating:
                                                        <select
                                                            value={newReview.rating}
                                                            onChange={(e) => setNewReview({ ...newReview, rating: parseInt(e.target.value) })}
                                                        >
                                                            {[0, 1, 2, 3, 4, 5].map((r) => (
                                                                <option key={r} value={r}>{r}</option>
                                                            ))}
                                                        </select>
                                                    </label>
                                                    <textarea
                                                        placeholder="Write your review..."
                                                        value={newReview.review}
                                                        onChange={(e) => setNewReview({ ...newReview, review: e.target.value })}
                                                    />

                                                    <div className="review-form-actions">
                                                        <button className="submit-review-btn" onClick={() => {
                                                            const user = JSON.parse(localStorage.getItem("user"));
                                                            if (!user) {
                                                                const confirmLogin = window.confirm("You must be logged in to give review. Do you want to login now?");
                                                                if (confirmLogin) {
                                                                    navigate("/login");
                                                                }
                                                                return;
                                                            }

                                                        }}>
                                                            {editingReviewId ? "Update Review" : "Submit Review"}
                                                        </button>
                                                        {editingReviewId && (
                                                            <button
                                                                type="button"
                                                                className="cancel-edit-btn"
                                                                onClick={() => {
                                                                    setNewReview({ rating: 0, review: "" });
                                                                    setEditingReviewId(null);
                                                                }}
                                                            >
                                                                Cancel
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                            </div>
                                        </div>

                                    ) : modalContent === "availability" ? (
                                        <div className="challenge-section">
                                            <h2>Posted Challenges</h2>
                                            <div className="challenge-card-container">
                                                {challengeDetails.length > 0 ? (
                                                    challengeDetails.map((challenge, index) => (
                                                        <div key={index} className="challenge-card">
                                                            <div className="challenge-card-header">
                                                                <h3>{challenge.court.title} - {challenge.court.sportname}</h3>
                                                                <p>
                                                                    <span className={`status-challenge-badge ${challenge.challengestatus === 'open' ? 'open' :
                                                                        challenge.challengestatus === 'accepted' ? 'accepted' : 'completed'
                                                                        }`}>
                                                                        Challenge: {` ${challenge.challengestatus}`}
                                                                    </span>

                                                                </p>
                                                            </div>

                                                            <div className="challenge-card-body">
                                                                <div className="player-section">
                                                                    <div className="player-info">
                                                                        <img
                                                                            src={challenge?.firstUser.avatar || '/default-user.png'}
                                                                            alt={challenge.firstUser.name}
                                                                        />
                                                                        <h4>{challenge.firstUser.name}</h4>
                                                                        <p>Phone: {challenge.firstUser.Phone || 'N/A'}</p>
                                                                    </div>

                                                                    <div className="vs-divider">VS</div>

                                                                    {challenge.secondUser ? (
                                                                        <div className="player-info">
                                                                            <img
                                                                                src={challenge?.secondUser.avatar || '/naavatar.webp'}
                                                                                alt={challenge.secondUser.name}
                                                                            />
                                                                            <h4>{challenge.secondUser.name}</h4>
                                                                            <p>Phone: {challenge.secondUser.Phone || 'N/A'}</p>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="player-info">
                                                                            <div className="empty-player">
                                                                                <img src="/naavatar.webp" alt="Waiting for opponent" />
                                                                                <h4>Waiting for opponent</h4>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <div className="challenge-details">
                                                                    <p><strong>Date:</strong> {new Date(challenge.booking.date).toLocaleDateString()}</p>
                                                                    <p><strong>Time:</strong> {challenge.booking.starting_hour}:00 - {challenge.booking.ending_hour}:00</p>
                                                                    <p><strong>Duration:</strong> {challenge.booking.duration} hour(s)</p>
                                                                    <p><strong>Price:</strong> Rs. {challenge.booking.price}</p>
                                                                    {challenge.details && <p><strong>Details:</strong> {challenge.details}</p>}
                                                                </div>
                                                            </div>

                                                            <div className="challenge-card-footer">
                                                                {challenge.challengestatus === 'open'&&(
                                                                    <button
                                                                        className="accept-btn"
                                                                        onClick={() => {
                                                                            const user = JSON.parse(localStorage.getItem("user"));
                                                                            if (!user) {
                                                                                const confirmLogin = window.confirm("You must be logged in to register. Do you want to login now?");
                                                                                if (confirmLogin) {
                                                                                    navigate("/login");
                                                                                }
                                                                                return;
                                                                            }

                                                                        }}
                                                                    >
                                                                        Accept Challenge
                                                                    </button>
                                                                )}


                                                                {challenge.challengestatus === 'accepted' && (
                                                                    <div className="match-confirmed">
                                                                        <span>Match Confirmed!</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="no-challenges">

                                                        <p>No challenges posted for this venue yet.</p>

                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <h2>
                                                {modalContent === "sports" && "Courts & Sports"}
                                                {modalContent === "courts" && "Courts & Pricing"}
                                                {modalContent === "services" && "Services"}
                                                {modalContent === "policies" && "Policies"}
                                                {modalContent === "timings" && "Timings"}
                                            </h2>

                                            {modalContent === "sports" && (
                                                <ul>{venue.sports.map((sport, i) => <li key={i}>{sport}</li>)}</ul>
                                            )}

                                            {modalContent === "courts" && (
                                                <div>
                                                    {venue.courts.map((court, i) => (
                                                        <p key={i}><strong>{court.title}:</strong> Rs. {court.price_per_hour} ({court.sportname})</p>
                                                    ))}
                                                </div>
                                            )}

                                            {modalContent === "services" && (
                                                <ul>{venue.details?.amenities?.map((a, i) => <li key={i}>{a}</li>)}</ul>
                                            )}

                                            {modalContent === "policies" && (
                                                <p>{venue.details?.venuepolicy}</p>
                                            )}

                                            {modalContent === "timings" && (
                                                venue.details?.openinghours?.map((t, i) => <p key={i}>{t}</p>)
                                            )}
                                        </>
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
                    <h2>No venue found.</h2>
                )}
            </div>
        </div>
    );
};

export default Venue;
