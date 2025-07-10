import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './Calendar.css';
import "./calender_input.css";

function MyCalendar({ onDateSelect }) {
    const [date, setDate] = useState(null);
    const [showCalendar, setShowCalendar] = useState(false); // calendar visibility

    const today = new Date();
    const sevenDaysAhead = new Date();
    sevenDaysAhead.setDate(today.getDate() + 9);

    const handleDateChange = (newDate) => {
        setDate(newDate);
        onDateSelect(newDate);
        setShowCalendar(false); // Close calendar after selecting
    };

    const toggleCalendar = () => {
        setShowCalendar(!showCalendar);
    };

    return (
        <div className='calendar-container'>
            <div className='input-container'>
                <label htmlFor="date" className="input-label">Date</label>
                
                {/* Input Field (Click to open calendar) */}
                <input 
                    id="date"
                    className="input-field"
                    type="text" 
                    placeholder='Select'
                    value={date ? date.toDateString() : ''}
                    readOnly
                    onClick={() => setShowCalendar(true)} // Show on input click
                />

                {/* Toggle Button (click to close/open) */}
                <button onClick={toggleCalendar} className="calendar-toggle-btn">
                    📅
                </button>
            </div>

            {/* Conditionally render calendar */}
            {showCalendar && (
                <div className='date-container'>
                    <Calendar 
                        onChange={handleDateChange} 
                        value={date}
                        minDate={today}
                        maxDate={sevenDaysAhead}
                    />
                </div>
            )}
        </div>
    );
}

export default MyCalendar;
