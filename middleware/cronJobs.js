import { PrismaClient } from "@prisma/client";
import cron from "node-cron";
import { generateAvailabilityForVenue } from "../controller/availability.controller.js"; // ✅ make sure correct path
import moment from "moment-timezone";

const prisma = new PrismaClient();

const generateAvailabilityForAllVenues = async () => {
    try {
        console.log("🟢 Running daily availability update...");

        const venues = await prisma.venue.findMany();
        console.log(`Found ${venues.length} venues`);

        for (const venue of venues) {
            const venueDetail = await prisma.venueDetail.findUnique({
                where: { venueId: venue.id },
            });

            if (!venueDetail || !venueDetail.openinghours) {
                console.warn(`No opening hours for venue ${venue.name}`);
                continue;
            }

            const openingHours = venueDetail.openinghours;

            const courts = await prisma.venueCourt.findMany({
                where: { venueId: venue.id },
            });

            for (const court of courts) {
                const oldestSlot = await prisma.availability.findFirst({
                    where: { courtId: court.id },
                    orderBy: { date: "asc" },
                });

                if (oldestSlot) {
                    await prisma.availability.deleteMany({
                        where: { courtId: court.id, date: oldestSlot.date },
                    });
                    console.log(`🗑️ Deleted availability for court ${court.id} on ${oldestSlot.date}`);
                } else {
                    console.log(`No availability to delete for court ${court.id}`);
                }

                // Generate only 1 day
                await generateAvailabilityForVenue({
                    body: { venueId: venue.id, courtId: court.id, openingHours, isInitial: false }
                }, null); // ✅ no need to mock res
            }
        }

        console.log("✅ Daily availability update completed.");
    } catch (error) {
        console.error("❌ Error updating availability:", error);
    }
};

cron.schedule("0 0 * * *", () => {
  console.log("🕛 Cron job triggered at midnight daily.");
  generateAvailabilityForAllVenues();
});



// Function to check if challenges should be cancelled based on passed starting hour
const updateExpiredChallenges = async () => {
    try {
        // console.log("🟢 Checking for expired challenges...");

        // Get all court bookings that have passed their starting hour and have a pending challenge
        const expiredBookings = await prisma.courtBook.findMany({
            where: {
                date: {
                    lte: new Date(),  // The booking date must be less than or equal to the current date
                },
                starting_hour: {
                    lte: new Date().getHours(),  // Compare the starting hour with the current time
                },
                
            },
            include: {
                challenges: {
                    where: {
                        challengestatus: 'open',  // Only include challenges with a 'pending' status
                    },
                },
            },
        });

        if (expiredBookings.length > 0) {
            console.log(`Found ${expiredBookings.length} expired bookings with pending challenges`);

            // Iterate through expired bookings and update challenges to 'cancelled'
            for (const booking of expiredBookings) {
                for (const challenge of booking.challenges) {
                    const updatedChallenge = await prisma.challenge.update({
                        where: { id: challenge.id },
                        data: {
                            challengestatus: 'cancelled',
                        },
                    });
                    console.log(`🛑 Updated challenge ${updatedChallenge.id} to 'cancelled'`);
                }
            }
        } else {
            // console.log("No expired bookings with pending challenges found.");
        }
    } catch (error) {
        console.error("❌ Error checking for expired challenges:", error);
    }
};

// Cron job to run at midnight daily to check for expired challenges
cron.schedule("*/15 * * * *", () => {
  console.log("🔄 Checking for expired challenges every 15 minutes.");
  updateExpiredChallenges();
});


// ✅ Booking status auto-update
const updatePastBookings = async () => {
  try {
    // console.log("🟢 Checking for past bookings to auto-update...");

    const nowNepal = moment().utcOffset(345);

    const bookings = await prisma.courtBook.findMany({
      where: {
        status: "CONFIRMED",
        date: { lte: nowNepal.toDate() },
      },
    });

    for (const booking of bookings) {
      const bookingEnd = moment(booking.date)
        .utcOffset(345)
        .set("hour", booking.ending_hour)
        .set("minute", 0)
        .set("second", 0);

      if (nowNepal.isAfter(bookingEnd)) {
        const newStatus = booking.paymentStatus === "success" ? "COMPLETED" : "CANCELLED";

        await prisma.courtBook.update({
          where: { id: booking.id },
          data: { status: newStatus },
        });

        console.log(`📘 Booking ${booking.id} marked as ${newStatus}`);
      }
    }

    // console.log("✅ Booking auto-status update completed.");
  } catch (err) {
    console.error("❌ Error auto-updating booking status:", err.message);
  }
};

// Run every 30 minutes
cron.schedule("*/30 * * * *", () => {
  console.log("🔄 Auto-updating past bookings every 30 minutes.");
  updatePastBookings();
});


export default cron;
