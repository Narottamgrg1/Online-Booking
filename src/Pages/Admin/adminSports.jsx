import React, { useContext, useEffect, useState } from "react";
import apiRequest from "../../../lib/apiReq";
import AdminNav from "../../../defaultPage/AdminNav";

import "./adminSports.css"; // Optional: for custom styles
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const AdminSports = () => {
    const { currentUser } = useContext(AuthContext);
    const [sports, setSports] = useState([]);
    const [selectMode, setSelectMode] = useState(false);
    const [selectedSports, setSelectedSports] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
                    if (currentUser.role!=="admin") {
                        navigate("/login");
                    }
                }, [currentUser, navigate]);

    useEffect(() => {
        const fetchSports = async () => {
            try {
                const response = await apiRequest.get("/sport/getSport");
                if (response.data) {
                    setSports(response.data);
                }
            } catch (error) {
                console.error("Failed to fetch sports:", error);
            }
        };

        fetchSports();
    }, []);

    const toggleSelectMode = () => {
        setSelectMode(!selectMode);
        setSelectedSports([]);
    };

    const handleCheckboxChange = (sportId) => {
        setSelectedSports((prev) =>
            prev.includes(sportId)
                ? prev.filter((id) => id !== sportId)
                : [...prev, sportId]
        );
    };

    const handleDelete = async () => {
        if (selectedSports.length === 0) return alert("No sports selected!");

        if (!window.confirm(`Are you sure you want to delete ${selectedSports.length} sport(s)?`)) {
            return;
        }

        try {
            await apiRequest.post("/sport/deletesports", { ids: selectedSports });

            setSports((prev) => prev.filter((sport) => !selectedSports.includes(sport.id)));
            setSelectedSports([]);
            setSelectMode(false);
        } catch (error) {
            console.error("Failed to delete sports:", error);
        }
    };

    return (
        <div className="main-container">
            <AdminNav />
            <div className="sports-table-container">
                <h2>Sports</h2>
                 <p>Total Sports: {sports.length}</p>
                <button onClick={toggleSelectMode}>
                    {selectMode ? "Cancel" : "Delete Sport"}
                </button>
                <table className="sports-table">
                    <thead>
                        <tr>
                            {selectMode && <th>Select</th>}
                            <th>ID</th>
                            <th>Sport Name</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sports.map((sport, index) => (
                            <tr key={sport.id}>
                                {selectMode && (
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={selectedSports.includes(sport.id)}
                                            onChange={() => handleCheckboxChange(sport.id)}
                                        />
                                    </td>
                                )}
                                <td>{index + 1}</td> {/* This line replaces sport.id */}
                                <td>{sport.name}</td>
                            </tr>
                        ))}

                    </tbody>
                </table>

                {selectMode && (
                    <div className="delete-footer">
                        <button
                            className="confirm-delete-button"
                            onClick={handleDelete}
                            disabled={selectedSports.length === 0}
                        >
                            Confirm ({selectedSports.length})
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminSports;
