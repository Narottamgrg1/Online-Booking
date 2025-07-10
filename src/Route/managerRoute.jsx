import ManagerProfile from "../Pages/manager/managerProfile";
import ManagerBook from "../Pages/manager/managerBook";
import ManagerCourt from "../Pages/manager/managerCourt";
import ManagerVenueAdd from "../Pages/manager/managerVenueAdd";
import ManagerVenueUpdate from "../Pages/manager/managerVenueUpdate";
import ManagerSchedule from "../Pages/manager/managerSchedule";
import ManagerAvailability from "../Pages/manager/managerAvailability";
import ManagerTournament from "../Pages/manager/managerTournament";
import ManagerAnalytics from "../Pages/manager/managerAnalytics";
import ManagerLoyalty from "../Pages/manager/managerLoyalty";
// import { singlePageloader } from "../../lib/singlePageloader";

const managerRoutes = [
  { path: "profile", element: <ManagerProfile /> },
  { path: "book", element: <ManagerBook /> },
  { path: "court", element: <ManagerCourt />}, //, loader: singlePageloader 
  { path: "add", element: <ManagerVenueAdd /> },
  { path: "update", element: <ManagerVenueUpdate /> },
  { path: "schedulde", element: <ManagerSchedule /> },
  { path: "updateAvailability", element: <ManagerAvailability /> },
  { path: "Tournament", element: <ManagerTournament /> },
  { path: "analytics", element: <ManagerAnalytics /> },
  { path: "loyalty", element: <ManagerLoyalty /> },

];

export default managerRoutes;
