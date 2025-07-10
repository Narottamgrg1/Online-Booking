import react, { useContext, useState, useEffect } from "react";
import Nav1 from "../../../defaultPage/userNavigation";
import "./userProfile.css";
import { AuthContext } from "../../context/AuthContext";
import apiRequest from "../../../lib/apiReq";
import { useNavigate } from "react-router-dom";
import UploadWidget from "../../../defaultPage/UploadWidget";

function userProfileEdit() {
    const [error, setError] = useState("");
    const { currentUser, updateUser } = useContext(AuthContext);
    const [avatar, setAvatar] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
            if (currentUser.role!=="user") {
                navigate("/login");
            }
        }, [currentUser, navigate]);

    const handlesubmit = async (e) => {
        e.preventDefault()

        const formData = new FormData(e.target)

        const { name, email, Phone, password } = Object.fromEntries(formData);

        try {
            const res = await apiRequest.put(`/user/${currentUser.id}`, {
                name,
                Phone,
                email,
                password,
                avatar

            })
            updateUser(res.data)
            navigate("/user/profile")
        } catch (err) {
            console.log(err);
            setError(err.response.data.message)
        }
    }

    return (
        currentUser &&
        <div>
            <Nav1 />

            <div className="userProfile-Container">
                <img
                    src={avatar || currentUser.avatar || "/naavatar.webp"}
                    alt="avatar"
                    className="user-profile-img"
                />
                <UploadWidget
                    uwConfig={{
                        cloudName: "gbros",
                        uploadPreset: "CourtBook",
                        maxImageFileSize: 2000000,
                        folders: "avatars",
                        multiple: false, // Change to false if you want single image mode
                    }}
                    setState={setAvatar} // Will handle both single and multiple uploads
                    multiple={false} // Pass this to ensure correct handling
                />


                <form onSubmit={handlesubmit}>

                    <div className="item">
                        <label htmlFor="name">Name:</label>
                        <input id="name" name="name" type="text" defaultValue={currentUser.name} required />
                    </div>

                    <div className="item">
                        <label htmlFor="phone">Contact:</label>
                        <input id="Phone" name="Phone" type="text" defaultValue={currentUser.Phone} required />
                    </div>

                    <div className="item">
                        <label htmlFor="email">E-mail:</label>
                        <input id="email" name="email" type="email" defaultValue={currentUser.email} required />
                    </div>

                    <div className="item">
                        <label htmlFor="password">Password:</label>
                        <input id="password" name="password" type="password" />
                    </div>

                    <button>Update</button>
                    {error && <span className="error-message">{error}</span>}

                </form>
            </div>
        </div>
    )
}

export default userProfileEdit;