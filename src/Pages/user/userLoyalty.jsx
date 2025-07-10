import React, { useEffect, useState,useContext } from "react";
import Nav1 from "../../../defaultPage/userNavigation";
import apiRequest from "../../../lib/apiReq";
import { useNavigate } from "react-router-dom";
import "./userLoyalty.css";
import { AuthContext } from "../../context/AuthContext";

const Loyalty = () => {
    const { currentUser } = useContext(AuthContext);
    const [loyaltyCards, setLoyaltyCards] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
            if (currentUser.role!=="user") {
                navigate("/login");
            }
        }, [currentUser, navigate]);

    useEffect(() => {
        const fetchLoyalty = async () => {
            try {
                const response = await apiRequest.get("/loyalty/getloyaltyofuser");
                if (response && response.data && response.data.card) {
                    // Update card status if points are sufficient and not already redeemed
                    const updatedCards = response.data.card.map(card => ({
                        ...card,
                        status: card.status === "REDEEMED" 
                            ? "REDEEMED" 
                            : card.points >= card.venue.loyaltyPoint 
                                ? "Ready to Redeem" 
                                : card.status
                    }));
                    setLoyaltyCards(updatedCards);
                }
            } catch (error) {
                console.error("Error fetching loyalty cards:", error);
            }
        };

        fetchLoyalty();
    }, []);

    return (
        <div className="main-loyalty-container">
            <Nav1 />
            <div className="loyalty-container">
                <h2>Loyalty Cards</h2>
                <div className="loyalty-cards">
                    {loyaltyCards.length === 0 ? (
                        <p>No loyalty cards found.</p>
                    ) : (
                        loyaltyCards.map((card) => (
                            <div key={card.id} className="loyalty-card" data-status={card.status}>
                                <div className="avatar-section">
                                    <img
                                        src={card.user.avatar}
                                        alt="Avatar"
                                        className="avatar-loyalty-img"
                                    />
                                    <div className="user-info">
                                        <p className="user-name">{card.user.name}</p>
                                        <p className="user-email">{card.user.email}</p>
                                    </div>
                                </div>

                                <h3 className="venue-title">{card.venue.title}</h3>
                                <p>Status: <strong className={card.status === "REDEEMED" ? "redeemed-status" : ""}>
                                    {card.status}
                                </strong></p>
                                <p>
                                    Points: <strong>{card.points}</strong> / {card.venue.loyaltyPoint}
                                </p>

                                <div className="points-container">
                                    <div
                                        className="points-progress"
                                        style={{ width: `${Math.min(100, (card.points / card.venue.loyaltyPoint) * 100)}%` }}
                                    ></div>
                                </div>

                                <div className="stamp-collection">
                                    {Array.from({ length: card.points }).map((_, i) => (
                                        <div key={i} className="stamp" title={`Stamp ${i + 1}`}>
                                            {i + 1}
                                        </div>
                                    ))}
                                </div>
                                
                                {card.points >= card.venue.loyaltyPoint && card.status !== "REDEEMED" && (
                                    <button
                                        className="redeem-button"
                                        onClick={() => navigate(`/user/booknow/${card.venue.id}`)}
                                    >
                                        Redeem Now
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Loyalty;