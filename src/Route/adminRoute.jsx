import AdminUsers from "../Pages/Admin/adminUsers";
import AdminVenues from "../Pages/Admin/adminVenue";
import AdminVenueInfo from "../Pages/Admin/adminVenueInfo";
import AdminSports from "../Pages/Admin/adminSports";

const adminRoutes = [
  { path: "users", element: <AdminUsers /> },
  { path: "venues", element: <AdminVenues /> },
  { path: "venues/venueinfo/:id", element: <AdminVenueInfo /> },
  { path: "sports", element: <AdminSports /> },

];

export default adminRoutes;
