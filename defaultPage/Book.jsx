import React, { useState, useEffect } from "react";

import Nav from "./NavigationBar";
import Search from "./Search";
import myimg from "../asset/naray-court.webp";
import "./Book.css"; // Import external CSs
import apiRequest from "../lib/apiReq";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";

function UserBook() {
    const [categories, setCategories] = useState([{ name: "All" }]); // Start with "All"
    const [courts, setCourts] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [searchTerm, setSearchTerm] = useState("");

    const navigate = useNavigate(); // ✅ Correct
    const location = useLocation();


    useEffect(() => {
        const fetchCourts = async () => {
            try {
                const queryParams = new URLSearchParams(location.search);
                const q = queryParams.get("q") || "";
                if (q) setSearchTerm(q); // Keep input synced

                const response = q
                    ? await apiRequest.get(`/venue/search?q=${encodeURIComponent(q)}`)
                    : await apiRequest.get("/venue/getVenues");

                setCourts(response.data.venues || []);
            } catch (error) {
                console.error("Error fetching courts:", error);
            }
        };
        fetchCourts();
    }, [location.search]);


    // Fetch sports from backend
    useEffect(() => {
        const fetchSports = async () => {
            try {
                const response = await apiRequest.get("/sport/getSport");
                const sportsData = response.data.map((sport) => ({ name: sport.name }));
                setCategories([{ name: "All" }, ...sportsData]); // Add sports dynamically
            } catch (error) {
                console.error("Error fetching sports:", error);
            }
        };
        fetchSports();
    }, []);

    const handleSearch = () => {
        const query = searchTerm.trim();

        if (!query) {
            navigate(location.pathname); // Clear search param
        } else {
            navigate(`${location.pathname}?q=${encodeURIComponent(query)}`);
        }
    };


    // Filter courts based on selected category
    const filteredCourts = selectedCategory === "All"
        ? courts
        : courts.filter((court) => court.sports.includes(selectedCategory));

    return (
        <div className="book-container">
            <Nav />
            <Search
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                onSearch={handleSearch}
            />


            {/* Categories */}
            <div className="categories">
                {categories.map((category) => (
                    <button
                        key={category.name}
                        className={`category-button ${selectedCategory === category.name ? "active" : ""}`}
                        onClick={() => setSelectedCategory(category.name)}
                    >
                        <span className="category-name">{category.name}</span>
                    </button>
                ))}
            </div>

            {/* Court Cards */}
            <div className="court-grid">
                {filteredCourts.length > 0 ? (
                    filteredCourts.map((court) => (
                        <div key={court.id} className="court-card">
                            <img src={court.imgs[0] || myimg} alt="Court" className="court-image" />
                            <div className="court-info">
                                <h3 className="court-type">{court.sports.join(", ")}</h3>
                                <h2 className="court-title">{court.title}</h2>
                                <p className="court-location">{court.city}, {court.address}</p>

                                <div className="court-buttons">
                                    <button
                                        className="view-button"
                                        onClick={() => navigate(`/venue/page/${court.id}`)}
                                    >
                                        View
                                    </button>
                                    <button
                                        className="book-button"
                                        onClick={() => {
                                            navigate(`/venue/availability/${court.id}`);

                                        }}
                                    >
                                        Book
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="no-data">No venues available.</p>
                )}
            </div>
        </div>
    );
}

export default UserBook;
