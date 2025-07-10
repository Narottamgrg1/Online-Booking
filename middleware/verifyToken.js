import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ message: "Not Authorized!" });
    }

    if (!process.env.JWT_SECRET_KEY) {
        console.error("JWT_SECRET_KEY is missing!");
        return res.status(500).json({ message: "Internal server error" });
    }

    jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, payload) => {
        if (err) {
            console.error("Token verification error:", err);
            return res.status(403).json({ message: "Token is not valid!" });
        }

        req.userId = payload.id;
        next();
    });
};