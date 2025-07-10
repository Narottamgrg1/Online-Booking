// main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import './index.css';  // Import Tailwind or other CSS
import RouteComponent from "./Route/authRoute";
import HomeP from "../defaultPage/HomeP";
import Nav from "../defaultPage/NavigationBar";
import Book from "../defaultPage/Book";
import UserRoute from "./Route/userRoute";
// import Calendar from "../defaultPage/Calendar";
import { AuthContextProvider } from "./context/AuthContext";
// import Home from "./Pages/manager/Home";


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthContextProvider>  
    <RouteComponent />  {/* Use the capitalized component name */}
    </AuthContextProvider>
  </React.StrictMode>
);
