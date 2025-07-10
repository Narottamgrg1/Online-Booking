import React, { useEffect, useState } from "react";
import ManagerNav from "../../../defaultPage/ManagerNav";
import "./managerLoyalty.css"
import apiRequest from "../../../lib/apiReq";
// import { format } from 'date-fns';

const ManagerLoyalty = () => {
    const [venue, setVenue] = useState(null);
    const [cards, setCards] = useState([]);

    useEffect(() => {
        const fetchCards = async () => {
            const storedVenue = JSON.parse(localStorage.getItem("venue_data"));
            if (storedVenue) {
                setVenue(storedVenue);
            }
            try {
                const response = await apiRequest.get(`/loyalty/getloyaltyforvenue/${storedVenue.id}`)
                setCards(response.data.card);
            } catch (error) {
                console.error("Failed to fetch loyalty cards", error);
            }
        }
        fetchCards();
    }, []);

    // Function to render stamp circles
    const renderStampCircles = (points, totalRequired) => {
        const circles = [];
        for (let i = 1; i <= totalRequired; i++) {
            circles.push(
                <div 
                    key={i} 
                    className={`stamp-circle ${i <= points ? 'filled' : ''}`}
                >
                    {i <= points ? '✓' : ''}
                </div>
            );
        }
        return circles;
    };

    // Function to format date
    const formatDate = (dateString) => {
        try {
            return new Date(dateString).toLocaleDateString();
        } catch {
            return dateString; // fallback if date parsing fails
        }
    };

    return (
        <div className="main-managerloyalty-container">
            <ManagerNav />
            <div className="managerloyalty-content">
                <h2>Loyalty Cards for {venue?.title}</h2>
                {cards.length === 0 ? (
                    <p>No loyalty cards found.</p>
                ) : (
                    <div className="loyalty-cards-container">
                        {cards.map((card) => (
                            <div key={card.id} className="loyalty-card">
                                <div className="card-header">
                                    <h3>{card.user?.name}'s Loyalty Card</h3>
                                    <p>Status: <span className={`status-${card.status.toLowerCase()}`}>{card.status}</span></p>
                                </div>
                                
                                <div className="card-meta">
                                    <p>Issued: {formatDate(card.createdAt)}</p>
                                    <p>Last updated: {formatDate(card.updatedAt)}</p>
                                </div>
                                
                                <div className="stamp-card">
                                    {renderStampCircles(card.points, card.venue?.loyaltyPoint)}
                                </div>
                                
                                <div className="progress-text">
                                    {card.points} / {card.venue?.loyaltyPoint} stamps collected
                                </div>
                                
                                <div className="card-footer">
                                    <p>Email: {card.user?.email}</p>
                                    <p>Phone: {card.user?.Phone}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default ManagerLoyalty;