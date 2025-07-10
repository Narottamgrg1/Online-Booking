import React, { useContext, useEffect } from "react";
import Nav1 from "../../../defaultPage/userNavigation";

import { AuthContext } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import "./userProfile.css"

function UserProfile() {
    const { currentUser } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (currentUser.role!=="user") {
            navigate("/login");
        }
    }, [currentUser, navigate]);

    return (
        currentUser && (
            <div>
                <Nav1 />
                <div className="userProfile-Container">
                    <img 
                        src={currentUser.avatar || "/naavatar.webp"} 
                        alt="avatar" 
                        className="user-profile-img"
                    />
                    
                    <span className="user-span">
                        Name: <b>{currentUser.name || "Not provided"}</b>
                    </span>
                    
                    <span className="user-span">
                        Contact: <b>{currentUser.Phone || "Not provided"}</b>
                    </span>
                    
                    <span className="user-span">
                        Email: <b>{currentUser.email}</b>
                    </span>
                    
                    <Link to="/user/profile/edit">
                        <button>Edit Profile</button>
                    </Link>
                </div>
            </div>
        )
    );
}

export default UserProfile;