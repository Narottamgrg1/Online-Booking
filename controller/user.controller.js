import { PrismaClient } from "@prisma/client";

import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export const getUser = async (req, res) => {
    const id = req.params.id
    try {
        const user = await prisma.user.findUnique({
            where: { id },
        });

        const { password, ...rest } = user;
        res.status(200).json(rest);

    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "Failed to get user" })
    }
}

export const allUsers = async (req, res) => {
    try {
        // Fetch all users from the database (no orderBy)
        const users = await prisma.user.findMany();

        // Remove password and sort case-insensitive
        const usersWithoutPassword = users
            .map(({ password, ...rest }) => rest)
            .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

        res.status(200).json({
            message: "Users fetched successfully",
            users: usersWithoutPassword
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({
            message: "Failed to fetch users",
            error: error.message
        });
    }
};





export const updateUser = async (req, res) => {
    const id = req.params.id;
    const tokenUserId = req.userId;
    const { password, avatar, ...inputs } = req.body

    if (id !== tokenUserId) {
        return res.status(403).json({ message: "Not Authorized!" })
    }

    let updatedPassword = null;

    try {

        if (password) {
            updatedPassword = await bcrypt.hash(password, 10)
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: {
                ...inputs,
                ...(updatedPassword && { password: updatedPassword }),
                ...(avatar && { avatar: avatar }),
            },
        })

        const { password: userPassword, ...rest } = updatedUser;

        res.status(200).json(rest);
    } catch (err) {
        console.log(err)

        res.status(500).json({ message: "Failed to update user" })
    }
}

export const deleteUser = async (req, res) => {
    const id = req.params.id;
    const tokenUserId = req.userId;

    if (id !== tokenUserId) {
        return res.status(403).json({ message: "Not Authorized!" })
    }
    try {
        await prisma.user.delete({
            where: { id }
        })
        res.status(200).json({ message: "User deleted" })
    } catch (err) {
        console.log(err)

        res.status(500).json({ message: "Failed to delete user" })
    }
}


export const deleteUsersByAdmin = async (req, res) => {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Invalid request. Please provide an array of user IDs.' });
    }

    try {
        await prisma.$transaction(async (prisma) => {
            // 1️⃣ Delete RegisteredTournamentTeam
            await prisma.registeredTournamentTeam.deleteMany({
                where: {
                    userId: { in: ids }
                }
            });

            await prisma.challenge.deleteMany({
                where: {
                    OR: [
                        { firstUserId: { in: ids } },
                        { secondUserId: { in: ids } }
                    ]
                }
            });

            await prisma.venueReviewAndRating.deleteMany({
                where:{
                    userId:{in:ids}
                }
            })

            await prisma.loyalty.deleteMany({
                where:{
                    userId: { in: ids }
                }
            })


            // 2️⃣ Delete bookings made by the users themselves
            const userCourtBooks = await prisma.courtBook.findMany({
                where: {
                    userId: { in: ids }
                },
                select: { id: true }
            });
            const userCourtBookIds = userCourtBooks.map(cb => cb.id);

            if (userCourtBookIds.length > 0) {
                await prisma.payment.deleteMany({
                    where: {
                        bookingId: { in: userCourtBookIds }
                    }
                });
                await prisma.availability.deleteMany({
                    where: {
                        bookingId: { in: userCourtBookIds }
                    }
                });
                await prisma.courtBook.deleteMany({
                    where: {
                        id: { in: userCourtBookIds }
                    }
                });
            }

            // 3️⃣ Delete bookings for courts owned by these users (even if booked by others)
            const venueCourts = await prisma.venueCourt.findMany({
                where: {
                    userId: { in: ids }
                },
                select: { id: true }
            });
            const venueCourtIds = venueCourts.map(vc => vc.id);

            if (venueCourtIds.length > 0) {
                const courtBooksForVenue = await prisma.courtBook.findMany({
                    where: {
                        courtId: { in: venueCourtIds }
                    },
                    select: { id: true }
                });
                const venueCourtBookIds = courtBooksForVenue.map(cb => cb.id);

                if (venueCourtBookIds.length > 0) {
                    await prisma.payment.deleteMany({
                        where: {
                            bookingId: { in: venueCourtBookIds }
                        }
                    });
                    await prisma.availability.deleteMany({
                        where: {
                            bookingId: { in: venueCourtBookIds }
                        }
                    });
                    await prisma.courtBook.deleteMany({
                        where: {
                            id: { in: venueCourtBookIds }
                        }
                    });
                }
            }

            // 4️⃣ Delete VenueDetail for these users
            await prisma.venueDetail.deleteMany({
                where: {
                    userId: { in: ids }
                }
            });

            // 5️⃣ Delete Tournaments related to the venues owned by these users
            const venues = await prisma.venue.findMany({
                where: {
                    userId: { in: ids }
                },
                select: { id: true }
            });
            const venueIds = venues.map(v => v.id);

            if (venueIds.length > 0) {
                // First, delete tournaments related to these venues
                await prisma.tournament.deleteMany({
                    where: {
                        venueId: { in: venueIds }
                    }
                });

                // 6️⃣ Delete VenueCourt (safe now)
                await prisma.venueCourt.deleteMany({
                    where: {
                        venueId: { in: venueIds }
                    }
                });

                // 7️⃣ Delete venues + their availability
                await prisma.availability.deleteMany({
                    where: {
                        venueId: { in: venueIds }
                    }
                });
                await prisma.venue.deleteMany({
                    where: {
                        id: { in: venueIds }
                    }
                });
            }

            // 8️⃣ Finally delete the users
            await prisma.user.deleteMany({
                where: {
                    id: { in: ids }
                }
            });
        });

        res.status(200).json({ message: 'Users and related data deleted successfully.' });
    } catch (error) {
        console.error('Error bulk deleting users:', error);
        res.status(500).json({ error: 'An error occurred while deleting users.' });
    }
};







