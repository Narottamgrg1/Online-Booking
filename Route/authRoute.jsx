import React from "react";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import HomeP from "../../defaultPage/HomeP";  
import LoginPage from "../Pages/Auth/login";
import RegisterPage from "../Pages/Auth/register";
import VerifyEmail from "../Pages/Auth/verifyEmail"; // path as per your file structure
import ForgotPasswordPage from "../Pages/Auth/forgotPassword";
import ResetPasswordPage from "../Pages/Auth/ResetPasswordPage";
import Book from "../../defaultPage/Book";
import userRoutes from "./userRoute"; 
import managerRoutes from "./managerRoute";
import adminRoutes from "./adminRoute";
import Tournament from "../../defaultPage/Tournament";
import VenuePage from "../../defaultPage/venuePage";
import VenueAvailability from "../../defaultPage/venueAvailability";

const router = createBrowserRouter([
  { path: "/", element: <HomeP /> },
  { path: "/book", element: <Book /> },
  { path: "/Tournament", element: <Tournament /> },
  { path: "/venue/page/:id", element: <VenuePage /> },
  { path: "/venue/availability/:id", element: <VenueAvailability /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/reset-password", element: <ResetPasswordPage  /> },
  { path: "/forgot-password", element: <ForgotPasswordPage  /> },
  { path: "/verify-email", element: <VerifyEmail /> },
  { path: "/user", children: userRoutes },
  { path: "/manager", children: managerRoutes },
  { path: "/admin", children: adminRoutes },
]);

const RouteComponent = () => {
  return <RouterProvider router={router} />;
};

export default RouteComponent;
