import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Helper function to parse opening hours
const parseOpeningHours = (openinghours) => {
    const schedule = {};
    const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

    openinghours.forEach((entry) => {
        if (!entry || typeof entry !== "string") return;

        const parts = entry.split(" ");
        const day = parts[0].toLowerCase();
        const hours = parts.slice(1).join(" ");

        if (!daysOfWeek.includes(day) || !hours.includes("-")) {
            console.warn(`Skipping invalid entry: ${entry}`);
            return;
        }

        const [start, end] = hours.split("-").map((h) => h.trim());

        const parseTime = (time) => {
            if (!time) return null;
            const match = time.match(/(\d+)(am|pm)/);
            if (!match) {
                console.warn(`Skipping invalid time format: ${time}`);
                return null;
            }

            let [_, hour, period] = match;
            hour = parseInt(hour);

            if (period === "pm" && hour !== 12) hour += 12;
            if (period === "am" && hour === 12) hour = 0;

            return hour.toString().padStart(2, "0") + ":00";
        };

        schedule[day] = {
            startTime: parseTime(start),
            endTime: parseTime(end),
        };
    });

    return schedule;
};

// New parser for your time array of objects
const parseOpeningHoursforupdate = (openinghours) => {
  const schedule = {};
  const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

  openinghours.forEach((entry) => {
    if (!entry || typeof entry !== "object") return;

    const day = entry.day.toLowerCase();
    const open = entry.open;
    const close = entry.close;

    if (!daysOfWeek.includes(day) || !open || !close) {
      console.warn(`Skipping invalid entry: ${JSON.stringify(entry)}`);
      return;
    }

    const parseTime = (time) => {
      if (!time) return null;
      const match = time.match(/(\d+)(am|pm)/i);
      if (!match) {
        console.warn(`Skipping invalid time format: ${time}`);
        return null;
      }

      let [_, hour, period] = match;
      hour = parseInt(hour);

      if (period.toLowerCase() === "pm" && hour !== 12) hour += 12;
      if (period.toLowerCase() === "am" && hour === 12) hour = 0;

      return hour.toString().padStart(2, "0") + ":00";
    };

    schedule[day] = {
      startTime: parseTime(open),
      endTime: parseTime(close),
    };
  });

  return schedule;
};



// Helper function to get Nepal local date (YYYY-MM-DD) with timezone offset
const getNepalLocalDateTimeString = (date) => {
    const nepalTime = new Date(date.getTime() + 345 * 60 * 1000);
    const year = nepalTime.getUTCFullYear();
    const month = (nepalTime.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = nepalTime.getUTCDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}T00:00:00.000+05:45`;
};

export const generateAvailabilityForVenue = async (req, res) => {
    const { venueId, courtId, openingHours, isInitial = true } = req.body;

    if (!courtId) {
        return res.status(400).json({ message: "Court ID is required" });
    }

    try {
        const latestSlot = await prisma.availability.findFirst({
            where: { venueId, courtId },
            orderBy: { date: "desc" },
        });

        let startDate;
        if (latestSlot) {
            const lastDate = new Date(latestSlot.date);
            startDate = new Date(lastDate);
            startDate.setDate(lastDate.getDate() + 1);
        } else {
            startDate = new Date(); // start from today
        }

        const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        const schedule = parseOpeningHours(openingHours);

        const availabilitySlots = [];
        const daysToGenerate = isInitial ? 7 : 1; // 🔥 key difference

        for (let i = 0; i < daysToGenerate; i++) {
            const targetDate = new Date(startDate);
            targetDate.setDate(startDate.getDate() + i);

            const dayName = daysOfWeek[targetDate.getDay()];
            const daySchedule = schedule[dayName];

            if (!daySchedule) {
                console.log(`Venue closed on ${dayName}, skipping availability for ${targetDate}`);
                continue;
            }

            const nepalLocalDateTime = getNepalLocalDateTimeString(targetDate);

            let currentHour = parseInt(daySchedule.startTime.split(":")[0]);
            const endHour = parseInt(daySchedule.endTime.split(":")[0]);

            while (currentHour < endHour) {
                availabilitySlots.push({
                    venueId,
                    courtId,
                    date: nepalLocalDateTime,
                    startTime: currentHour,
                    endTime: currentHour + 1,
                    isAvailable: true,
                    bookingId: null,
                });
                currentHour++;
            }
        }

        if (availabilitySlots.length === 0) {
            console.log("⚠️ No availability slots generated.");
            if (res) return res.status(200).json({ message: "No availability generated." });
            return;
        }

        await prisma.availability.createMany({ data: availabilitySlots });

        console.log(`✅ Availability generated for court ${courtId} for ${daysToGenerate} day(s)`);

        if (res) return res.status(201).json({ message: `Availability generated for next ${daysToGenerate} day(s)` });
    } catch (error) {
        console.error(error);
        if (res) return res.status(500).json({ message: "Failed to generate availability" });
    }
};

export const genavailabilityForUpdate = async (req, res) => {
  const { venueId, courtId, openingHours } = req.body;

  if (!courtId) {
    if (res) return res.status(400).json({ message: "Court ID is required" });
    return;
  }

  try {
    const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const schedule = parseOpeningHoursforupdate(openingHours);

    const availabilitySlots = [];
    const startDate = new Date(); // always today
    const daysToGenerate = 7;

    for (let i = 0; i < daysToGenerate; i++) {
      const targetDate = new Date(startDate);
      targetDate.setDate(startDate.getDate() + i);

      const dayName = daysOfWeek[targetDate.getDay()];
      const daySchedule = schedule[dayName];

      if (!daySchedule) {
        console.log(`Venue closed on ${dayName}, skipping availability for ${targetDate}`);
        continue;
      }

      const nepalLocalDateTime = getNepalLocalDateTimeString(targetDate);

      let currentHour = parseInt(daySchedule.startTime.split(":")[0]);
      const endHour = parseInt(daySchedule.endTime.split(":")[0]);

      while (currentHour < endHour) {
        availabilitySlots.push({
          venueId,
          courtId,
          date: nepalLocalDateTime,
          startTime: currentHour,
          endTime: currentHour + 1,
          isAvailable: true,
          bookingId: null,
        });
        currentHour++;
      }
    }

    if (availabilitySlots.length === 0) {
      console.log("⚠️ No availability slots generated.");
      if (res) return res.status(200).json({ message: "No availability generated." });
      return;
    }

    // Delete existing availability for next 7 days for this court
    // BUT only delete slots that are isAvailable = true (unbooked slots)
    await prisma.availability.deleteMany({
      where: {
        venueId,
        courtId,
        isAvailable: true,
        date: {
          gte: new Date(startDate.setHours(0, 0, 0, 0)),
          lt: new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
      },
    });

    await prisma.availability.createMany({ data: availabilitySlots });

    console.log(`✅ Availability generated for court ${courtId} for next ${daysToGenerate} days`);

    if (res) return res.status(201).json({ message: `Availability generated for next ${daysToGenerate} days` });
  } catch (error) {
    console.error(error);
    if (res) return res.status(500).json({ message: "Failed to generate availability" });
  }
};



export const getAvailabilities = async (req, res) => {
    const { venueId } = req.params;
    const { date, sportname } = req.query; // Get both the date and sportsName from query string

    if (!date) {
        return res.status(400).json({ message: "Date query parameter is required" });
    }


    try {
        // Log the incoming query for debugging
        console.log(`Received query with date: ${date} and sportname: ${sportname}`);

        // Parse the date and ensure it's midnight UTC (start of the day)
        const queryDate = new Date(date); 
        queryDate.setUTCHours(0, 0, 0, 0); // Normalize to start of the day (midnight UTC)

        // Get the end of the day (23:59:59.999 UTC)
        const endOfDay = new Date(queryDate);
        endOfDay.setUTCHours(23, 59, 59, 999);

        // First, get the courts that match the sportsName
        const courts = await prisma.venueCourt.findMany({
            where: {
                venueId: venueId,
                sportname: sportname, // Filter by sportsName
            },
        });

        if (!courts.length) {
            console.log("No courts found with the selected sport");
            return res.status(404).json({ message: "No courts found with the selected sport" });
        }

        // Log the found courts for debugging
        console.log(`Found courts: ${JSON.stringify(courts)}`);

        // Extract court IDs for further filtering
        const courtIds = courts.map(court => court.id);

        // Query availability for the selected date and matching courtIds
        const availability = await prisma.availability.findMany({
            where: {
                venueId: venueId,
                date: {
                    gte: queryDate.toISOString(), // Greater than or equal to the start of the day
                    lte: endOfDay.toISOString(), // Less than or equal to the end of the day
                },
                courtId: {
                    in: courtIds, // Filter by courts with the matching sportsName
                },
            },
        });

        if (!availability.length) {
            console.log("No availability found for the selected date and sport");
            return res.status(404).json({ message: "No availability found for the selected date and sport" });
        }

        res.status(200).json({ message: "Fetched availability successfully", availability });
    } catch (err) {
        console.error("Error while fetching availabilities:", err); // Log the error details
        res.status(500).json({ message: "Failed to get availabilities!" });
    }
};

import moment from "moment-timezone";

export const getAvailabilitiesbyBody = async (req, res) => {
    const { venueId } = req.params;
    const { date, courtId, sportname } = req.body;

    if (!date || !courtId || !sportname) {
        return res.status(400).json({ message: "Date, courtId, and sport name are required" });
    }

    try {
        // console.log(`📥 Received venueId: ${venueId}, date: ${date}, courtId: ${courtId}, sportname: ${sportname}`);

        // Convert request date and current date to Nepal timezone
        const requestDateNepal = moment.tz(date, "Asia/Kathmandu").format("YYYY-MM-DD");
        const todayNepal = moment().tz("Asia/Kathmandu").format("YYYY-MM-DD");

        const isToday = requestDateNepal === todayNepal;
        const currentHourNepal = moment().tz("Asia/Kathmandu").hour();


        // Create start and end of day in Nepal time, then convert to UTC for DB query
        const queryDateStart = moment.tz(requestDateNepal, "Asia/Kathmandu").startOf("day").toDate();
        const queryDateEnd = moment.tz(requestDateNepal, "Asia/Kathmandu").endOf("day").toDate();

        // Optional: Check that the court exists and belongs to the correct venue/sport
        const court = await prisma.venueCourt.findFirst({
            where: {
                id: courtId,
                venueId,
                sportname,
            },
        });

        if (!court) {
            return res.status(404).json({ message: "Court not found for the selected sport in this venue." });
        }

        // Build filter condition with optional time filtering
        const whereCondition = {
            venueId,
            courtId,
            date: {
                gte: queryDateStart,
                lte: queryDateEnd,
            },
            ...(isToday && {
                startTime: { gt: currentHourNepal },
            }),
        };

        const availability = await prisma.availability.findMany({
            where: whereCondition,
            orderBy: [
                { startTime: "asc" },
                { endTime: "asc" },
            ],
        });

        if (!availability.length) {
            return res.status(404).json({ message: "No availability found for the selected court and date." });
        }

        res.status(200).json({ message: "Fetched availability successfully", availability });

    } catch (err) {
        console.error("❌ Error fetching availabilities:", err);
        res.status(500).json({ message: "Failed to get availabilities!", error: err.message });
    }
};



// import moment from 'moment';

export const getAvailabilitiesbyBodyForManager = async (req, res) => {
    const { venueId } = req.params;
    const { date, courtId, sportname } = req.body;

    if (!date || !courtId || !sportname) {
        return res.status(400).json({ message: "Date, courtId, and sport name are required" });
    }

    try {
        // Normalize date to start and end of day (UTC)
        const queryDate = moment(date).startOf('day');
        const endOfDay = moment(queryDate).endOf('day');

        // Verify court exists and belongs to venue and sport
        const court = await prisma.venueCourt.findFirst({
            where: {
                id: courtId,
                venueId,
                sportname,
            },
        });

        if (!court) {
            return res.status(404).json({ message: "Court not found for the selected sport in this venue." });
        }

        // Fetch all availability for date
        const availability = await prisma.availability.findMany({
            where: {
                venueId,
                courtId,
                date: {
                    gte: queryDate.toDate(),
                    lte: endOfDay.toDate(),
                },
            },
            orderBy: [{ startTime: 'asc' }],
        });

        if (!availability.length) {
            return res.status(404).json({ message: "No availability found for the selected court and date." });
        }

        // Filter past time slots if date is today
        const now = moment();

        let filteredAvailability = availability;

        if (queryDate.isSame(now, 'day')) {
            const currentHour = now.hour();
            filteredAvailability = availability.filter(slot => slot.startTime >= currentHour);
        }

        res.status(200).json({ message: "Fetched availability successfully", availability });

    } catch (err) {
        console.error("❌ Error fetching availabilities:", err);
        res.status(500).json({ message: "Failed to get availabilities!", error: err.message });
    }
};






export const updateAvailabilities = async (req, res) => {
    const { venueId } = req.params;
    const userId = req.userId;
    const { updates } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
        return res.status(400).json({ message: "No updates provided" });
    }

    try {
        const venue = await prisma.venue.findUnique({
            where: { id: venueId },
        });

        if (!venue) {
            return res.status(404).json({ message: "Venue not found" });
        }

        if (venue.userId !== userId) {
            return res.status(403).json({ message: "Not authorized to update this venue's availability" });
        }

        // Check that the availability entries belong to this venue
        const validAvailabilityIds = await prisma.availability.findMany({
            where: {
                id: { in: updates.map(u => u.id) },
                venueId: venueId,
            },
            select: { id: true },
        });

        const validIds = new Set(validAvailabilityIds.map(a => a.id));

        const filteredUpdates = updates.filter(update => validIds.has(update.id));

        // Run updates in parallel
        const updatePromises = filteredUpdates.map(update =>
            prisma.availability.update({
                where: { id: update.id },
                data: { isAvailable: update.isAvailable },
            })
        );

        await Promise.all(updatePromises);

        res.status(200).json({ message: "Availability updated successfully" });
    } catch (error) {
        console.error("❌ Error updating availability:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};


export const updateVenueTime = async (req, res) => {
  const { venueId } = req.params;
  const { time } = req.body;

  if (!time || !Array.isArray(time)) {
    return res.status(400).json({ message: "Invalid time format" });
  }

  try {
    const venue = await prisma.venue.findUnique({ where: { id: venueId } });
    if (!venue) return res.status(404).json({ message: "Venue not found" });

    const newSchedule = parseOpeningHoursforupdate(time);

    // Validate schedule entries
    for (const day in newSchedule) {
      const daySchedule = newSchedule[day];
      if (
        !daySchedule ||
        !daySchedule.startTime ||
        !daySchedule.endTime ||
        !/^\d{2}:\d{2}$/.test(daySchedule.startTime) ||
        !/^\d{2}:\d{2}$/.test(daySchedule.endTime)
      ) {
        delete newSchedule[day];
      }
    }

    const courts = await prisma.venueCourt.findMany({
      where: { venueId },
      select: { id: true },
    });
    if (!courts.length)
      return res.status(404).json({ message: "No courts found for this venue" });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dayNames = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];

    // Determine days changed (same logic as before)
    const referenceCourtId = courts[0].id;
    const daysChanged = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const day = dayNames[date.getDay()];
      const newHours = newSchedule[day];
      if (!newHours) continue;

      const existingSlots = await prisma.availability.findMany({
        where: {
          venueId,
          courtId: referenceCourtId,
          date: {
            gte: date,
            lt: new Date(date.getTime() + 24 * 60 * 60 * 1000),
          },
        },
        orderBy: { startTime: "asc" },
      });

      if (!existingSlots.length) {
        daysChanged.push(day);
        continue;
      }

      const existingStart = existingSlots[0].startTime;
      const existingEnd = existingSlots[existingSlots.length - 1].endTime;
      const newStart = parseInt(newHours.startTime.split(":")[0]);
      const newEnd = parseInt(newHours.endTime.split(":")[0]);

      if (existingStart !== newStart || existingEnd !== newEnd) {
        daysChanged.push(day);
      }
    }

    if (!daysChanged.length) {
      return res
        .status(200)
        .json({ message: "No changes detected in venue opening hours." });
    }

    // Delete only available slots for changed days, keep booked ones
    for (const court of courts) {
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const day = dayNames[date.getDay()];

        if (daysChanged.includes(day)) {
          await prisma.availability.deleteMany({
            where: {
              venueId,
              courtId: court.id,
              isAvailable: true,
              date: {
                gte: date,
                lt: new Date(date.getTime() + 24 * 60 * 60 * 1000),
              },
            },
          });
        }
      }
    }

    // Now regenerate availability for all courts but skip booked slots
    for (const court of courts) {
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const day = dayNames[date.getDay()];

        if (!daysChanged.includes(day)) continue;

        const daySchedule = newSchedule[day];
        if (!daySchedule) continue;

        const startHour = parseInt(daySchedule.startTime.split(":")[0]);
        const endHour = parseInt(daySchedule.endTime.split(":")[0]);

        // Get booked slots for this court and date to skip them
        const bookedSlots = await prisma.availability.findMany({
          where: {
            venueId,
            courtId: court.id,
            date: {
              gte: date,
              lt: new Date(date.getTime() + 24 * 60 * 60 * 1000),
            },
            isAvailable: false, // booked or unavailable slots
          },
          select: { startTime: true },
        });

        const bookedStartTimes = new Set(bookedSlots.map((s) => s.startTime));

        const newSlots = [];

        for (let hour = startHour; hour < endHour; hour++) {
          if (!bookedStartTimes.has(hour)) {
            newSlots.push({
              venueId,
              courtId: court.id,
              date,
              startTime: hour,
              endTime: hour + 1,
              isAvailable: true,
              bookingId: null,
            });
          }
        }

        if (newSlots.length > 0) {
          await prisma.availability.createMany({ data: newSlots });
        }
      }
    }

    return res
      .status(200)
      .json({ message: "Venue opening hours updated and availability regenerated." });
  } catch (error) {
    console.error("❌ Error updating venue time:", error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};






