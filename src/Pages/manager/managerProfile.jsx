import React, { useContext, useEffect } from "react";
import ManagerNav from "../../../defaultPage/ManagerNav";
import "./managerProfile.css";
import apiRequest from "../../../lib/apiReq";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

const ManagerProfile = () => {
  const navigate = useNavigate();
  const { currentUser, updateUser } = useContext(AuthContext);

  useEffect(() => {
              if (currentUser.role!=="manager") {
                  navigate("/login");
              }
          }, [currentUser, navigate]);

  const handleLogout = async () => {
    try {
      await apiRequest.post("/auth/logout");
      updateUser(null);
      localStorage.removeItem("venue_data"); // Clear venue data
      navigate("/");
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="main-container">
      <ManagerNav />

      <div className="managerProfile-container">
        <img
          src="/naavatar.webp"
          alt="avatar"
          className="manager-img"
        />

        <span className="manager-span">
          Name: <b>{currentUser?.name || "Narottam"}</b>
        </span>

        <span className="manager-span">
          Contact: <b>{currentUser?.phone || "123456789"}</b>
        </span>

        <span className="manager-span">
          E-mail: <b>{currentUser?.email || "narottam@gmail.com"}</b>
        </span>

        <button className="profile-btn">Edit Profile</button>

        <button className="profile-btn logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default ManagerProfile;
