import UserHome from "../Pages/user/userHome";
import UserBook from "../Pages/user/userBook";
// import UserDeal from "../Pages/user/userDeal";
import UserTournament from "../Pages/user/userTournament";
import UserProfile from "../Pages/user/userProfile";
import UserProfileEdit from "../Pages/user/userProfileEdit";
import UserSingleCourt from "../Pages/user/userSingleCourt";
import Availability from "../../defaultPage/Availability";
import Booknow from "../Pages/user/userBookNow";
import BookingConfirmation from "../Pages/user/userBookConfirmation";
import BookingResult from "../Pages/user/userResult";
import History from "../Pages/user/userHistory";
import UserTournamentHistory from "../Pages/user/userTournamentHistory";
import UserLoyaltyCard from "../Pages/user/userLoyalty";

const userRoutes = [
    { path: "home", element: <UserHome /> },
    { path: "book", element: <UserBook /> },
    // { path: "deal", element: <UserDeal /> },
    { path: "tournament", element: <UserTournament /> },
    { path: "tournament/history", element: <UserTournamentHistory /> },
    { path: "loyalty", element: <UserLoyaltyCard /> },
    { path: "profile", element: <UserProfile /> },
    { path: "profile/edit", element: <UserProfileEdit /> },
    { path: "book/history", element: <History /> },
    { path: "venue/:id", element: <UserSingleCourt /> },
    { path: "availability/:id", element: <Availability /> },
    { path: "booknow/:id", element: <Booknow /> },
    { path: "confirmation/:id", element: <BookingConfirmation /> },
    { path: "result/:id", element: <BookingResult /> },
];

export default userRoutes;
