import prisma from "../lib/prisma.js";
import moment from "moment"; // Import moment.js
import nodemailer from 'nodemailer';

export const createBooking = async (req, res) => {
  const { courtId, date, startTime, duration } = req.body;
  const userId = req.userId;
  const { venueId } = req.params;  // Extract venueId from URL

  if (!userId || !venueId || !courtId || date == null || startTime == null || !duration) {
    return res.status(400).json({ message: "Missing required booking details" });
  }

  try {
    // Convert the input date from UTC to Nepal Time (NPT) using moment
    const nepalTime = moment(date).utcOffset(345); // UTC +5:45 (Nepal Time)

    // Fetch the latest availability record for the court on the given date, based on endTime
    const lastAvailability = await prisma.availability.findFirst({
      where: {
        courtId,
        venueId,
        date: nepalTime.toDate(),
        isAvailable: true,
      },
      orderBy: {
        endTime: 'desc',
      },
      select: {
        endTime: true,
      },
    });

    // Check if there's an existing availability
    if (!lastAvailability) {
      return res.status(404).json({ message: "No availability found for this court on the selected date" });
    }

    // Use the actual last endTime from availability
    const lastAvailabilityEndTime = lastAvailability.endTime;
    // Ensure that the requested booking duration fits within the available slots
    const requestedEndTime = parseInt(startTime) + parseInt(duration);

    if (requestedEndTime > lastAvailabilityEndTime) {
      return res.status(400).json({ message: "Booking duration exceeds available time slots" });
    }

    // Fetch price_per_hour from the VenueCourt model
    const venueCourt = await prisma.venueCourt.findUnique({
      where: { id: courtId },
      select: { price_per_hour: true },
    });

    if (!venueCourt) {
      return res.status(404).json({ message: "Court not found" });
    }

    // Calculate the total price based on price_per_hour and duration
    const totalPrice = venueCourt.price_per_hour * duration;

    // Convert the start time and end time for comparison in Nepal Time
    const start = parseInt(startTime);
    const end = start + parseInt(duration);

    // Check for slot conflict using the availability table (compare with Nepal Time)
    const overlapping = await prisma.availability.findMany({
      where: {
        courtId,
        venueId,
        date: nepalTime.toDate(), // Use moment to convert to JavaScript Date object
        startTime: {
          gte: start,
          lt: end,
        },
        isAvailable: false,
      },
    });

    if (overlapping.length > 0) {
      return res.status(409).json({ message: "One or more slots are already booked" });
    }

    // Create booking with payment status as PENDING
    const booking = await prisma.courtBook.create({
      data: {
        userId,
        venueId,
        courtId,
        date: nepalTime.toDate(), // Store booking date in Nepal Time
        starting_hour: startTime, // Store as Nepal time input
        ending_hour: startTime + duration, // Store as Nepal time input
        duration,
        price: totalPrice, // Store the calculated price
        paymentStatus: "PENDING", // Set the payment status as PENDING by default
        status: "PENDING", // or CONFIRMED / CANCELLED etc.
      },
    });

    // Update availability based on the selected time (in Nepal Time)
    await prisma.availability.updateMany({
      where: {
        courtId,
        venueId,
        date: nepalTime.toDate(), // Use Nepal Time for comparison and update
        startTime: {
          gte: start,
          lt: end,
        },
        isAvailable: true,
      },
      data: {
        isAvailable: false,
        bookingId: booking.id,
      },
    });

    res.status(201).json({ message: "Booking created successfully", booking });
  } catch (err) {
    console.error("❌ Booking error:", err);
    res.status(500).json({ message: "Failed to create booking", error: err.message });
  }
};


export const cancelBook = async (req, res) => {
  const { bookingId } = req.params;  // Extract venueId and bookingId from URL
  const userId = req.userId;  // Extract the userId from the request (assuming it's in req.userId)

  if (!bookingId) {
    return res.status(400).json({ message: "Missing booking ID or venue ID" });
  }

  try {
    // Fetch the booking to be cancelled
    const booking = await prisma.courtBook.findUnique({
      where: { id: bookingId },
    });

    const userChallenge = await prisma.challenge.findUnique({
      where: { bookId: bookingId }
    })

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }


    // Check if the current user is either the booking user or the venue owner
    if (booking.userId !== userId) {
      return res.status(403).json({ message: "You do not have permission to cancel this booking" });
    }

    // Update the availability table to make the slots available again
    await prisma.availability.updateMany({
      where: {
        courtId: booking.courtId,
        venueId: booking.venueId,
        date: booking.date,
        startTime: {
          gte: booking.starting_hour,
          lt: booking.ending_hour,
        },
      },
      data: {
        isAvailable: true,
        bookingId: null,  // Clear the booking reference
      },
    });

    if (userChallenge) {
      await prisma.challenge.delete({ where: { bookId: bookingId } });
    }
    await prisma.courtBook.delete({ where: { id: bookingId } });



    res.status(200).json({ message: "Booking cancelled successfully" });
  } catch (err) {
    console.error("❌ Cancellation error:", err);
    res.status(500).json({ message: "Failed to cancel booking", error: err.message });
  }
};



export const verifyBook = async (req, res) => {
  const { venueId } = req.params;
  const userId = req.userId;
  const { status, bookingId } = req.body;

  try {
    // Fetch the booking with court and venue details
    const booking = await prisma.courtBook.findUnique({
      where: { id: bookingId },
      include: {
        venue: true,
        court: true,
        user: true,  // Include the user who made the booking
      },
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.venueId !== venueId) {
      return res.status(403).json({ message: "Booking does not belong to this venue" });
    }

    if (booking.venue.userId !== userId) {
      return res.status(403).json({ message: "You are not authorized to verify this booking" });
    }

    const courtId = booking.courtId;
    const date = booking.date; // Already in UTC
    const startHour = booking.starting_hour;
    const endHour = booking.ending_hour;

    if (status === "CANCELLED") {
      // Mark those slots as available again (must match bookingId)
      await prisma.availability.updateMany({
        where: {
          courtId,
          venueId,
          date,
          startTime: {
            gte: startHour,
            lt: endHour,
          },
          bookingId: bookingId,
          isAvailable: false,
        },
        data: {
          isAvailable: true,
          bookingId: null,
        },
      });

      // Send email notification to user
      sendBookingStatusEmail(booking.user.email, "Your booking has been CANCELLED");
    } else if (status === "CONFIRMED") {
      // Mark slots as unavailable and link them to bookingId again
      await prisma.availability.updateMany({
        where: {
          courtId,
          venueId,
          date,
          startTime: {
            gte: startHour,
            lt: endHour,
          },
          isAvailable: true,
        },
        data: {
          isAvailable: false,
          bookingId: bookingId,
        },
      });

      // Send email notification to user
      sendBookingStatusEmail(booking.user.email, "Your booking has been CONFIRMED");
    }

    // Update the booking status
    await prisma.courtBook.update({
      where: { id: bookingId },
      data: { status },
    });

    res.status(200).json({ message: `Booking has been ${status.toLowerCase()}` });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Failed to verify", error: err.message });
  }
};

// Function to send email notifications to the user
const sendBookingStatusEmail = async (userEmail, statusMessage) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Court Booking" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: statusMessage,
      html: `
        <p>Dear user,</p>
        <p>${statusMessage}</p>
        <p>If you have any questions, feel free to contact us.</p>
        <p>Thank you for using Court Booking.</p>
      `,
    });
  } catch (err) {
    console.error("Error sending email:", err.message);
  }
};


export const getbookingForManager = async (req, res) => {
  const { venueId } = req.params;
  const { courtId = "all", status = "all" } = req.body; // defaults

  try {
    const bookings = await prisma.courtBook.findMany({
      where: {
        venueId,
        ...(courtId !== "all" && { courtId }),
        ...(status !== "all" && { status }),
      },
      select: {
        id: true,
        date: true,
        starting_hour: true,
        ending_hour: true,
        status: true,
        price: true,
        duration: true,
        paymentStatus: true,
        paymentMethod: true,
        court: {
          select: {
            title: true,
          },
        },
        user: {
          select: {
            name: true,
            Phone: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json(bookings);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to fetch bookings", error: err.message });
  }
};


export const getBookingById = async (req, res) => {
  const { bookingId } = req.params;

  try {
    const booking = await prisma.courtBook.findUnique({
      where: {
        id: bookingId,
      },
      select: {
        id: true,
        date: true,
        starting_hour: true,
        ending_hour: true,
        status: true,
        price: true,
        duration: true,
        paymentStatus: true,
        paymentMethod: true,
        court: {
          select: {
            title: true,
            sportname: true,
          },
        },
        user: {
          select: {
            name: true,
            Phone: true,
          },
        },
        venue: {
          select: {
            id: true,
            title: true,
            address: true,
            city: true,
          },
        },
      },
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.status(200).json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch booking", error: err.message });
  }
};


export const getBookingByUserId = async (req, res) => {
  const userId = req.userId;

  try {
    // 1. Bookings where user is the main user
    const directBookings = await prisma.courtBook.findMany({
      where: { userId },
      include: {
        venue: { select: { title: true } },
        court: { select: { title: true, sportname: true } },
      },
    });

    // 2. Bookings where user is second user in a challenge
    const challengesAsSecondUser = await prisma.challenge.findMany({
      where: { secondUserId: userId },
      select: {
        bookId: true,
      },
    });

    const secondUserBookIds = challengesAsSecondUser.map(c => c.bookId);

    const secondUserBookings = await prisma.courtBook.findMany({
      where: {
        id: { in: secondUserBookIds },
      },
      include: {
        venue: { select: { title: true } },
        court: { select: { title: true, sportname: true } },
      },
    });

    // 3. Combine both sets
    const allBookings = [...directBookings, ...secondUserBookings];

    // 4. Optional: Remove duplicates (in case a user is both first and second)
    const uniqueBookingsMap = new Map();
    allBookings.forEach(b => uniqueBookingsMap.set(b.id, b));
    const uniqueBookings = Array.from(uniqueBookingsMap.values());

    // 5. Sort by createdAt descending
    uniqueBookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (uniqueBookings.length === 0) {
      return res.status(404).json({ message: "No bookings found for this user" });
    }

    res.status(200).json({ message: "Bookings fetched successfully", bookings: uniqueBookings });
  } catch (error) {
    console.error("Error fetching bookings for user:", error);
    res.status(500).json({ error: "Failed to get bookings" });
  }
};

import { subWeeks, subMonths, startOfYear, endOfYear } from "date-fns";

export const getWeeklyTimeSlotStats = async (req, res) => {
  const { venueId } = req.params;
  const { courtId = "all", range = "1week", year } = req.body;

  try {
    let startDate;
    let endDate = new Date(); // default to now

    if (range === "1week") {
      startDate = subWeeks(new Date(), 1);
    } else if (range === "1month") {
      startDate = subMonths(new Date(), 1);
    } else if (range === "6month") {
      startDate = subMonths(new Date(), 6);
    } else if (range === "1year") {
      const targetYear = year || new Date().getFullYear();
      startDate = startOfYear(new Date(`${targetYear}-01-01`));
      endDate = endOfYear(new Date(`${targetYear}-12-31`));
    }

    const bookings = await prisma.courtBook.findMany({
      where: {
        venueId,
        date: {
          gte: startDate,
          lte: endDate,
        },
        ...(courtId !== "all" && { courtId }),
      },
      select: {
        date: true,
        starting_hour: true,
      },
    });

    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayTimeMap = {};

    days.forEach(day => {
      dayTimeMap[day] = { Morning: 0, Evening: 0, Night: 0 };
    });

    bookings.forEach(({ date, starting_hour }) => {
      const bookingDate = new Date(date);
      const dayName = days[bookingDate.getDay()];
      const hour = parseInt(starting_hour, 10);

      let slot = "Night";
      if (hour >= 6 && hour < 12) slot = "Morning";
      else if (hour >= 12 && hour < 18) slot = "Evening";

      dayTimeMap[dayName][slot]++;
    });

    res.status(200).json(dayTimeMap);
  } catch (error) {
    console.error("Error generating weekly time slot stats:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

