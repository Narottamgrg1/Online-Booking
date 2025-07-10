import React from "react";
import {Link} from "react-router-dom";
import "./ManagerNav.css";

function ManagerNav(){
    return(
        <div className="manager-nav">
            <nav className="side-nav">
                

                <Link to="/manager/profile">Profile</Link>
                <Link to="/manager/Book/">Book</Link>
                {/* <Link to="/manager/profile">Dashboard</Link> */}
                <Link to="/manager/Court">Court</Link>
                <Link to="/manager/schedulde">Schedule</Link>
                <Link to="/manager/updateAvailability">Availability</Link>
                {/* <Link to="/manager/profile">Rating/review</Link> */}
                <Link to="/manager/analytics">Analytics</Link>
                {/* <Link to="/manager/profile">Offer Deal</Link> */}
                <Link to="/manager/Tournament">Tournament</Link>
                <Link to="/manager/loyalty">Loyalty Cards</Link>
               
                
            </nav>
        </div>
    )
}

export default ManagerNav;