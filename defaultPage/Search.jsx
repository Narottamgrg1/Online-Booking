import React from "react";
import "./Search.css";

function Search({ searchTerm, setSearchTerm, onSearch }) {
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      onSearch();
    }
  };

  return (
    <div className="search-container">
      <div className="search-box">
        <input
          type="text"
          placeholder="Search venue name, city"
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className="search-button" onClick={onSearch}>
          Search
        </button>
      </div>
    </div>
  );
}

export default Search;
