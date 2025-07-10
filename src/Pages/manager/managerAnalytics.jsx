import React, { useEffect, useState,useContext } from 'react';
import apiRequest from '../../../lib/apiReq';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid,
    PieChart, Pie, Cell
} from 'recharts';
import ManagerNav from '../../../defaultPage/ManagerNav';
import "./managerAnalytics.css"
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#28a745', '#dc3545', '#ffc107']; // Morning, Evening, Night

const Analytics = () => {
    const { currentUser } = useContext(AuthContext);
    const [venue, setVenue] = useState(null);
    const [selectedSport, setSelectedSport] = useState("");
      const [selectedCourt, setSelectedCourt] = useState("all");
      const [filteredCourts, setFilteredCourts] = useState([]);
    const [range, setRange] = useState("1week");
    const [year, setYear] = useState(new Date().getFullYear());
    const [data, setData] = useState([]);
    const [selectedDay, setSelectedDay] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
                if (currentUser.role!=="manager") {
                    navigate("/login");
                }
            }, [currentUser, navigate]);

    useEffect(() => {
        const venueData = JSON.parse(localStorage.getItem("venue_data"));
        if (venueData && venueData.id) {
            setVenue(venueData);
        } else {
            alert("Venue data not found. Please login again.");
        }
    }, []);

    useEffect(() => {
  if (venue?.id) {
    fetchStats(selectedCourt); // always pass selectedCourt here
  }
}, [venue, range, year, selectedCourt]);

    const fetchStats = async (courtId = "all") => {
        try {
            const res = await apiRequest.post(`/book/getbookingforpie/${venue.id}`, {
                range,
                year: range === "1year" ? year : undefined,
                courtId
            });

            const result = Object.entries(res.data).map(([day, slots]) => ({
                day,
                Morning: slots.Morning,
                Evening: slots.Evening,
                Night: slots.Night
            }));

            setData(result);
            setSelectedDay(null); // Reset pie chart on data change
        } catch (err) {
            console.error("Error loading stats:", err);
            alert("Failed to load analytics.");
        }
    };

    const handleBarClick = (data, index) => {
        setSelectedDay({
            day: data.day,
            slots: [
                { name: "Morning", value: data.Morning },
                { name: "Evening", value: data.Evening },
                { name: "Night", value: data.Night },
            ]
        });
    };

     // Change sport and reset courts
const handleSportChange = (sport) => {
  setSelectedSport(sport);
  setSelectedCourt("all");
  if (venue?.courts?.length) {
    const filtered = venue.courts.filter(court => court.sportname === sport);
    setFilteredCourts(filtered);
  }
  fetchStats("all"); // fetch stats for all courts of selected sport
};

const handleCourtChange = (courtId) => {
  setSelectedCourt(courtId);
  fetchStats(courtId); // fetch stats for selected court
};

    return (

        <div className="analytics-container">
            <ManagerNav />
            <div className="analytics-content">
                <div className="analytics-header">
                    <h1>Booking Analytics</h1>
                </div>

                <div className="analytics-filters">
                    <select
                        value={range}
                        onChange={(e) => setRange(e.target.value)}
                    >
                        <option value="1week">Last 1 Week</option>
                        <option value="1month">Last 1 Month</option>
                        <option value="6month">Last 6 Months</option>
                        <option value="1year">Full Year</option>
                    </select>

                    {range === "1year" && (
                        <input
                            type="number"
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            min="2020"
                            max={new Date().getFullYear()}
                        />
                    )}

                    {venue && (
                        <>
                            <select value={selectedSport} onChange={(e) => handleSportChange(e.target.value)}>
                                <option value="" disabled>Select Sport</option>
                                {venue.sports.map((sport, index) => (
                                    <option key={index} value={sport}>{sport}</option>
                                ))}
                            </select>

                            {selectedSport && (
                                <select value={selectedCourt} onChange={(e) => handleCourtChange(e.target.value)}>
                                    <option value="all">All Courts</option>
                                    {filteredCourts.map((court) => (
                                        <option key={court.id} value={court.id}>{court.title}</option>
                                    ))}
                                </select>
                            )}
                        </>
                    )}
                </div>

                <div className="chart-container">
                    <div className="chart-title">Booking Trends</div>
                    <div className="bar-chart-container">
                        <ResponsiveContainer>
                            {/* Your Bar Chart code */}
                            <BarChart data={data} barGap={7} barCategoryGap="20%" onClick={({ activeLabel }) => {
                                const clicked = data.find((d) => d.day === activeLabel);
                                if (clicked) handleBarClick(clicked);
                            }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="day" />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="Morning" fill="#28a745" />
                                <Bar dataKey="Evening" fill="#dc3545" />
                                <Bar dataKey="Night" fill="#ffc107" />
                            </BarChart>


                        </ResponsiveContainer>
                    </div>
                </div>

                {selectedDay && (
                    <div className="chart-container">
                        <div className="pie-chart-title">
                            Booking Breakdown for {selectedDay.day}
                        </div>
                        <div className="pie-chart-container">
                            <ResponsiveContainer>
                                {/* Your Pie Chart code */}

                                <PieChart>
                                    <Pie
                                        data={selectedDay.slots}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={100}
                                        label
                                    >
                                        {selectedDay.slots.map((_, index) => (
                                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </div>
        </div>

    );
};


export default Analytics;

