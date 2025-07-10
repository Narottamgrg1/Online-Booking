// Importing required dependencies
import { PrismaClient } from '@prisma/client';
import { sendEmail } from '../lib/sendEmail.js';

const prisma = new PrismaClient();

import jwt from "jsonwebtoken"; // JSON Web Token library
import { generateAvailabilityForVenue } from './availability.controller.js';


export const addVenue = async (req, res) => {
    const { venueData, venueCourts, venueDetails } = req.body;
    const tokenUserId = req.userId; // Extracted from middleware

    try {
        // Check if the user already has a venue
        const existingVenue = await prisma.venue.findUnique({
            where: { userId: tokenUserId },
        });

        if (existingVenue) {
            return res.status(409).json({ message: "Venue already exists for this user." });
        }

        console.log("Received Data:", req.body);

        // Create new venue with status "pending"
        const newVenue = await prisma.venue.create({
            data: {
                ...venueData,
                userId: tokenUserId,
                status: "pending", // Set venue as pending initially
                courts: venueCourts?.length > 0 ? {
                    create: venueCourts.map(court => ({
                        title: court.title,
                        price_per_hour: Number(court.price_per_hour),
                        status: court.status,
                        sportname: court.sportName,
                        sport: { connect: { name: court.sportName } },
                        user: { connect: { id: tokenUserId } }
                    }))
                } : undefined,
                details: venueDetails ? {
                    create: {
                        openinghours: venueDetails.openinghours || [],
                        venuepolicy: venueDetails.venuepolicy || "",
                        amenities: venueDetails.amenities || [],
                        user: { connect: { id: tokenUserId } }
                    }
                } : undefined
            },
            include: { courts: true, details: true }
        });

        res.status(201).json({
            message: "Venue submitted for approval",
            newVenue,
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error inserting venue data", error: err.message });
    }
};


export const getVenue = async (req, res) => {
    const id = req.params.id;

    try {
        const venue = await prisma.venue.findUnique({
            where: { id },
            include: {
                courts: true,
                details: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        Phone: true
                        // exclude password and other sensitive fields
                    },
                },
            },
        });

        if (!venue) {
            return res.status(404).json({ message: "Venue not found" });
        }

        const { userId, ...filteredVenue } = venue;

        res.status(200).json({
            ...filteredVenue,
            courts: venue.courts.map(({ id, title, price_per_hour, status, sportname }) => ({
                id,
                title,
                price_per_hour,
                status,
                sportname,
            })),
            details: venue.details
                ? {
                    id: venue.details.id,
                    openinghours: venue.details.openinghours,
                    venuepolicy: venue.details.venuepolicy,
                    amenities: venue.details.amenities,
                }
                : null,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error fetching venue data" });
    }
};

export const getVenuesForAdmin = async (req, res) => {
    try {
        const venues = await prisma.venue.findMany({
            // where: {
            //     status: 'approved', // Only fetch venues where the status is 'approved'
            // },

        });

        res.status(200).json(venues);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Error fetching venues data" });
    }
};

export const getVenues = async (req, res) => {
    try {
        const venues = await prisma.venue.findMany({
            where: {
                status: 'approved', // Only fetch venues where the status is 'approved'
            },
        });

        res.status(200).json({ message: "Fetch Success", venues });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Error fetching venues data" });
    }
};



export const updateVenue = async (req, res) => {
    const id = req.params.id;
    const tokenUserId = req.userId;
    const { venueData, venueCourts, venueDetails } = req.body; // Destructure body

    try {
        // Fetch the venue first
        const venue = await prisma.venue.findUnique({
            where: { id },
            include: { courts: true, details: true },
        });

        if (!venue) {
            return res.status(404).json({ message: "Venue not found" });
        }

        // Authorization check
        if (venue.userId !== tokenUserId) {
            return res.status(403).json({ message: "Not authorized!" });
        }

        // console.log("Updating venue:", venueData);

        // **Update Venue Main Data**
        const updatedVenue = await prisma.venue.update({
            where: { id },
            data: {
                ...venueData,
            },
        });

        // Only update or create the courts that are present in the request
        if (venueCourts && venueCourts.length > 0) {
            for (const court of venueCourts) {
                // Upsert or update sport
                let sport = await prisma.sports.upsert({
                    where: { name: court.sportname },
                    update: {},
                    create: { name: court.sportname },
                });

                if (court.id) {
                    // Check if this court actually exists in DB before updating
                    const existingCourt = await prisma.venueCourt.findUnique({
                        where: { id: court.id },
                    });

                    if (existingCourt) {
                        await prisma.venueCourt.update({
                            where: { id: court.id },
                            data: {
                                title: court.title,
                                price_per_hour: Number(court.price_per_hour),
                                status: court.status,
                                sportname: court.sportname,
                                sportId: sport.id,
                            },
                        });
                    }
                    // else: silently ignore, don’t try to update a non-existent court
                } else {
                    // Create new court
                    const newCourt = await prisma.venueCourt.create({
                        data: {
                            title: court.title,
                            price_per_hour: Number(court.price_per_hour),
                            status: court.status,
                            sportname: court.sportname,
                            sportId: sport.id,
                            venueId: id,
                            userId: tokenUserId,
                        },
                    });

                    // Generate availability for the new court
                    if (venueDetails?.openinghours?.length) {
                        await generateAvailabilityForVenue({
                            body: {
                                venueId: id,
                                courtId: newCourt.id,
                                openingHours: venueDetails.openinghours,
                                isInitial: true,
                            },
                        }, null);
                    }
                }
            }
        }


        // **Update or Add Venue Details**
        if (venueDetails) {
            await prisma.venueDetail.upsert({
                where: { venueId: id },
                update: {
                    openinghours: venueDetails.openinghours || [],
                    venuepolicy: venueDetails.venuepolicy || "",
                    amenities: venueDetails.amenities || [],
                },
                create: {
                    openinghours: venueDetails.openinghours || [],
                    venuepolicy: venueDetails.venuepolicy || "",
                    amenities: venueDetails.amenities || [],
                    venueId: id, // ✅ Link details to the venue
                    userId: tokenUserId, // ✅ Link to user
                },
            });
        }

        // Fetch updated venue with courts and details
        const finalVenue = await prisma.venue.findUnique({
            where: { id },
            include: { courts: true, details: true },
        });

        res.status(200).json({ message: "Venue updated successfully", venue: finalVenue });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error updating venue data", error: err.message });
    }
};



export const deleteVenue = async (req, res) => {
    const id = req.params.id;
    const tokenUserId = req.userId;

    try {
        // Step 1: Find the venue
        const venue = await prisma.venue.findUnique({
            where: { id },
        });

        if (!venue) {
            return res.status(404).json({ message: "Venue not found" });
        }

        if (venue.userId !== tokenUserId) {
            return res.status(403).json({ message: "Not authorized!" });
        }

        // Step 2: Delete tournaments associated with the venue
        await prisma.tournament.deleteMany({
            where: {
                venueId: id,
            },
        });

        await prisma.challenge.deleteMany({
            where: {
                venueId: id,
            }
        })

        await prisma.loyalty.deleteMany({
            where:{venueId:id}
        })

        await prisma.venueReviewAndRating.deleteMany({
            where: {
                venueId: id
            }
        })

        // Step 3: Delete all payments related to the venue's courts' bookings
        await prisma.payment.deleteMany({
            where: {
                booking: {
                    court: {
                        venueId: id,
                    },
                },
            },
        });

        // Step 4: Delete all bookings related to the venue's courts
        await prisma.courtBook.deleteMany({
            where: {
                court: {
                    venueId: id,
                },
            },
        });

        // Step 5: Delete all courts associated with the venue
        await prisma.venueCourt.deleteMany({
            where: { venueId: id },
        });

        // Step 6: Delete venue details if they exist
        await prisma.venueDetail.deleteMany({
            where: { venueId: id },
        });

        // Step 7: Delete the venue itself
        await prisma.venue.delete({
            where: { id },
        });

        res.status(200).json({ message: "Venue and associated data Deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error deleting venue data" });
    }
};





export const getVenueByUser = async (userId) => {
    try {
        // Query the database for the single venue associated with the provided userId
        const venue = await prisma.venue.findFirst({
            where: {
                userId: userId,  // Match the userId to fetch the user's venue
            },
            include: {
                courts: true,       // Include related VenueCourt records (multiple courts)
                details: true,      // Include related VenueDetail record (single details)
            },
        });

        // If no venue is found, return null instead of throwing an error
        if (!venue) {
            return null; // No venue found, return null
        }

        // Return the fetched venue if found
        return venue;
    } catch (err) {
        console.error("Error fetching venue:", err);
        throw new Error("Failed to fetch venue.");
    }
};



export const adminApproval = async (req, res) => {
    const id = req.userId;
    const venueId = req.params.venueId;
    const { status: newStatus } = req.body;

    try {
        const admin = await prisma.user.findUnique({
            where: { id },
        });

        if (!admin || admin.role !== 'admin') {
            return res.status(403).json({ message: "Not authorized" });
        }

        const updatedVenue = await prisma.venue.update({
            where: { id: venueId },
            include: {
                user: true, // include user to get email
            },
            data: {
                status: newStatus,
            },
        });

        // Compose email message
        const userEmail = updatedVenue.user.email;
        const venueName = updatedVenue.title || "your venue";
        let subject = "";
        let text = "";

        if (newStatus === "approved") {
            subject = "Venue Approved 🎉";
            text = `Congratulations! Your venue "${venueName}" has been approved and is now live on the platform.`;
        } else if (newStatus === "declined") {
            subject = "Venue Declined ❌";
            text = `Unfortunately, your venue "${venueName}" has been declined. Please review your submission and try again.`;
        } else {
            subject = "Venue Status Updated";
            text = `The status of your venue "${venueName}" has been updated to "${newStatus}".`;
        }

        // Send email
        await sendEmail({ to: userEmail, subject, text });

        res.status(200).json({ message: `Venue ${newStatus} and email sent.`, venue: updatedVenue });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to approve/decline venue or send email" });
    }
};


export const searchBar = async (req, res) => {
    const { q } = req.query; // from URL: /api/venues/search?q=sports

    try {
        const venues = await prisma.venue.findMany({
            where: {
                OR: [
                    { title: { contains: q, mode: "insensitive" } },
                    { address: { contains: q, mode: "insensitive" } },
                    { city: { contains: q, mode: "insensitive" } },
                ],
            },
        });
        // console.log(venues)
        res.json({ message: "Search success", venues });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Search failed." });
    }
}