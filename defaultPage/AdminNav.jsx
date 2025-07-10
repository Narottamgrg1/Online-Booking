import React, { useState, useRef, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../src/context/AuthContext"; // Adjust path if needed
import "./AdminNav.css";
import apiRequest from "../lib/apiReq"; // Assuming you use same API helper

function AdminNav() {
    const { currentUser, updateUser } = useContext(AuthContext);
    const [isDropdownVisible, setDropdownVisible] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    // Toggle dropdown visibility when clicking profile section
    const toggleDropdown = () => {
        setDropdownVisible((prev) => !prev);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownVisible(false);
            }
        };

        document.addEventListener("click", handleClickOutside);

        return () => {
            document.removeEventListener("click", handleClickOutside);
        };
    }, []);

    const handleLogout = async () => {
        try {
            await apiRequest.post("/auth/logout");
            updateUser(null);
            navigate("/");
        } catch (err) {
            console.log(err);
        }
    };

    return (
        <div>
            {/* Top Navigation */}
            <nav className="admin-top-nav">
                <div className="logo">
                    <h2>Admin Panel</h2>
                </div>
                <div className="profile-section" ref={dropdownRef}>
                    <div className="profile-info" onClick={toggleDropdown}>
                        <img
                            src={currentUser?.avatar || "/naavatar.webp"}
                            alt="avatar"
                            className="admin-profile-img"
                        />
                        <span className="profile-name">{currentUser?.name || "Admin"}</span>
                        <button className="dropdown-button">
                            {isDropdownVisible ? "▲" : "▼"}
                        </button>
                    </div>
                    {isDropdownVisible && (
                        <div className="dropdown-menu">
                            <Link to="/admin/profile">
                                <button>Profile</button>
                            </Link>
                            <Link>
                            <button onClick={handleLogout}>Logout</button>
                            </Link>
                        </div>
                    )}
                </div>
            </nav>

            {/* Side Navigation */}
            <nav className="admin-side-nav">
                <Link to="/admin/users">Manage User</Link>
                <Link to="/admin/venues">Manage Venue</Link>
                <Link to="/admin/sports">Manage Sports</Link>
            </nav>
        </div>
    );
}

export default AdminNav;
