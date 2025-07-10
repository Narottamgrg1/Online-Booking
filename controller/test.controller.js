import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const shouldBeLoggedIn = async (req, res) => {
    console.log("Logged-in userId:", req.userId);
    return res.status(200).json({ message: "You are authenticated" });
};

export const shouldBeAdmin = async (req, res) => {
    const userId = req.userId;  // from the token

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.role === 'admin') {
            return res.status(200).json({ message: "You are authenticated as Admin" });
        } else {
            return res.status(403).json({ message: "Access denied: Not an admin" });
        }
    } catch (error) {
        console.error("Error checking admin status:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
