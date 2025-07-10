import React, { useContext, useEffect, useState } from "react";
import apiRequest from "../../../lib/apiReq";
import AdminNav from "../../../defaultPage/AdminNav";
import "./adminUsers.css"; // Add your own CSS file for styling
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const AdminUsers = () => {
  const { currentUser } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
                  if (currentUser.role!=="admin") {
                      navigate("/login");
                  }
              }, [currentUser, navigate]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await apiRequest.get("/user/getusers");
        if (response.data.users) {
          setUsers(response.data.users);
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    };

    fetchUsers();
  }, []);

  const toggleSelectMode = () => {
    setSelectMode(!selectMode);
    setSelectedUsers([]); // Reset selection when toggling
  };

  const handleCheckboxChange = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleDelete = async () => {
    if (selectedUsers.length === 0) return alert("No users selected!");

    if (!window.confirm(`Are you sure you want to delete ${selectedUsers.length} user(s)?`)) {
      return;
    }

    try {
      // Send delete request (assuming your API supports bulk delete)
      await apiRequest.post("/user/admin", { ids: selectedUsers });

      // Remove deleted users from state
      setUsers((prev) => prev.filter((user) => !selectedUsers.includes(user.id)));

      // Reset
      setSelectedUsers([]);
      setSelectMode(false);
    } catch (error) {
      console.error("Failed to delete users:", error);
    }
  };

  return (
    <div className="main-container">
      <AdminNav />
      <div className="user-table-container">
        <h2>Users</h2>
         <p>Total Users: {users.length}</p>
        <button onClick={toggleSelectMode}>
          {selectMode ? "Cancel" : "Delete User"}
        </button>
        <table className="user-table">
          <thead>
            <tr>
              {selectMode && <th>Select</th>}
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Role</th>
              <th>Verified</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                {selectMode && (
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleCheckboxChange(user.id)}
                    />
                  </td>
                )}
                <td>{user.name}</td>
                <td>{user.Phone}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>{user.isVerified ? "Yes" : "No"}</td>
                <td>{new Date(user.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {selectMode && (
          <div className="delete-footer">
            <button
              className="confirm-delete-button"
              onClick={handleDelete}
              disabled={selectedUsers.length === 0}
            >
              Confirm ({selectedUsers.length})
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
