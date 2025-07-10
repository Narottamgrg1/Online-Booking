import React, { useState, useEffect,useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Search from "../../../defaultPage/Search";
import myimg from "../../../asset/naray-court.webp";
import "../../../defaultPage/Book.css";
import Nav1 from "../../../defaultPage/userNavigation";
import apiRequest from "../../../lib/apiReq";
import { AuthContext } from "../../context/AuthContext";


function userBook() {
  const { currentUser } = useContext(AuthContext);
  const [searchTerm, setSearchTerm] = useState("");
  const [venues, setVenues] = useState([]);
  const [categories, setCategories] = useState([{ name: "All" }]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
          if (currentUser.role!=="user") {
              navigate("/login");
          }
      }, [currentUser, navigate]);


    useEffect(() => {
    const fetchVenues = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams(location.search);
        const q = queryParams.get("q") || "";
        if (q) setSearchTerm(q); // keep input in sync

        const response = q
          ? await apiRequest.get(`/venue/search?q=${encodeURIComponent(q)}`)
          : await apiRequest.get("/venue/getVenues");

        setVenues(response.data.venues);
        
      } catch (error) {
        console.error("Error fetching venues:", error);
      } finally {
        setLoading(false);
      }
      
    };

    fetchVenues();
  }, [location.search]); // 🔥 watch for changes in URL


  // Fetch sports
  useEffect(() => {
    const fetchSports = async () => {
      try {
        const response = await apiRequest.get("/sport/getSport");
        const sportsData = response.data.map((sport) => ({ name: sport.name }));
        setCategories([{ name: "All" }, ...sportsData]);
      } catch (error) {
        console.error("Error fetching sports:", error);
      }
    };
    fetchSports();
  }, []);

  const handleSearch = () => {
    const query = searchTerm.trim();

    if (!query) {
      navigate(location.pathname); // clear query
    } else {
      navigate(`${location.pathname}?q=${encodeURIComponent(query)}`);
    }
  };
  
  const filteredVenues =
    selectedCategory === "All"
      ? venues
      : venues.filter((venue) => venue.sports.includes(selectedCategory));

  return (
    <div className="book-container">
      <Nav1 />
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
            className={`category-button ${
              selectedCategory === category.name ? "active" : ""
            }`}
            onClick={() => setSelectedCategory(category.name)}
          >
            <span className="category-name">{category.name}</span>
          </button>
        ))}
      </div>

      {/* Venue Cards */}
      <div className="court-grid">
        {loading ? (
          <p className="loading">Loading venues...</p>
        ) : filteredVenues.length > 0 ? (
          filteredVenues.map((venue) => (
            <div key={venue.id} className="court-card">
              <img src={venue.imgs[0] || myimg} alt="Court" className="court-image" />
              <div className="court-info">
                <h3 className="court-type">{venue.sports.join(", ")}</h3>
                <h2 className="court-title">{venue.title}</h2>
                <p className="court-location">{venue.city}, {venue.address}</p>
                <div className="court-buttons">
                  <button
                    className="view-button"
                    onClick={() => navigate(`/user/venue/${venue.id}`)}
                  >
                    View
                  </button>
                  <button
                    className="book-button"
                    onClick={() => navigate(`/user/booknow/${venue.id}`)}
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

export default userBook;
