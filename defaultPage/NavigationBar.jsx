import React from "react";
import "./NavigationBar.css"; // Import external CSS

function Nav() {
  return (
    <div>
      {/* Top Navigation */}
      <header className="top-nav">
        <a href="/" className="logo">
          KhelGhar
        </a>
        <nav className="top-nav-links">
          
          <a href="/register" className="auth-link">Signup</a>
          <a href="/login" className="auth-link">Login</a>
        </nav>
      </header>

      {/* Bottom Navigation */}
      <div className="bottom-nav">
        <nav className="bottom-nav-links">
          <a href="/">Home</a>
          <a href="/Book">Venue</a>
          
          <a href="/Tournament">Tournament</a>
          
        </nav>
      </div>
    </div>
  );
}

export default Nav;
