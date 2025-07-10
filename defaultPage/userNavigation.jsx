import React, { useState, useRef, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./userNavigation.css"; // Import external CSS
import apiRequest from "../lib/apiReq";
import { AuthContext } from "../src/context/AuthContext";

function Nav1() {
  const { currentUser, updateUser } = useContext(AuthContext);
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Toggle dropdown visibility when clicking profile icon
  const toggleDropdown = () => {
    setDropdownVisible((prev) => !prev);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownVisible(false); // Close dropdown
      }
    };

    // Attach the event listener to the document
    document.addEventListener("click", handleClickOutside);

    // Cleanup the event listener on component unmount
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const handelLogout = async () => {
    try {
      await apiRequest.post("/auth/logout");
      updateUser(null);
      localStorage.removeItem("venue_data"); 
      navigate("/");
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div>
      {/* Top Navigation */}
      <header className="top-nav">
        <Link to="/user/home" className="logo">
        KhelGhar
        </Link>
        <nav className="top-nav-links">
          <div className="profile-icon" onClick={toggleDropdown} ref={dropdownRef}>
            <img 
              src={currentUser?.avatar || "/naavatar.webp"} 
              alt="avatar" 
              className="avatar-img"
            />
            {isDropdownVisible && (
              <div className="dropdown-menu">
                <Link to="/user/profile">
                <button>Profile</button>
                </Link>
                <Link to="/user/loyalty">
                <button>Loyalty</button>
                </Link>
                <Link to="/user/book/history">
                <button>Bookings</button>
                </Link>
                <Link to="/user/tournament/history">
                <button>Tournaments</button>
                </Link>
                <Link>
                <button onClick={handelLogout}>Logout</button>
                </Link>
              </div>
            )}
          </div>
        </nav>
      </header>

      {/* Bottom Navigation */}
      <div className="bottom-nav">
        <nav className="bottom-nav-links">
          <Link to="/user/home">Home</Link>
          <Link to="/user/book">Venue</Link>
          {/* <Link to="/user/deal">Deals</Link> */}
          <Link to="/user/tournament">Tournament</Link>
        </nav>
      </div>
    </div>
  );
}

export default Nav1;