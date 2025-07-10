import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiRequest from "../../../lib/apiReq";
import { AuthContext } from "../../context/AuthContext";

function LoginPage() {
  const [error, setError] = useState("");
  const [isLoading, setLoading] = useState(false);
  const { updateUser } = useContext(AuthContext);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(""); // Reset error state before submitting

    const formdata = new FormData(e.target);
    const email = formdata.get("email");
    const password = formdata.get("password");

    try {
      // Make API request to login
      const res = await apiRequest.post("/auth/login", {
        email,
        password,
      });

      // Extract user data from response
      const { user } = res.data;

      if (!user || !user.role) throw new Error("User role not found");

      // Update global user state with full user object including role
      updateUser(user);

      // Fetch user's venue data
      const venueRes = await apiRequest.get(`/venue/getuservenue/${user.id}`, {
        headers: {
          Authorization: `Bearer ${res.data.token}`, // Include JWT token in the request
        },
      });

      if (venueRes.status === 200) {
        // Store venue data in localStorage
        localStorage.setItem("venue_data", JSON.stringify(venueRes.data));
      }

      // Redirect based on role
      if (user.role === 'admin') {
        navigate('/admin/users');
      } else if (user.role === 'manager') {
        navigate('/manager/profile');
      } else {
        navigate('/user/home'); // default user home
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Login</h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email:
            </label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Enter your email"
              required
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-800"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password:
            </label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Enter your password"
              required
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-800"
            />
          </div>

          <button
            type="submit"
            className={`w-full bg-blue-500 text-white font-medium py-2 px-4 rounded-md hover:bg-blue-600 transition duration-300 ${isLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Login"}
          </button>

          {error && <span className="text-red-500 block mt-2">{error}</span>}
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Link to="/register" className="text-blue-500 hover:underline">
              Register here
            </Link>
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link to="/forgot-password" className="text-blue-500 hover:underline">
            Forgot password?
          </Link>

        </div>
      </div>
    </div>
  );
}

export default LoginPage;
