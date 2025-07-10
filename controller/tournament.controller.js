import moment from "moment-timezone";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();


export const createTournament = async (req, res) => {
  const { venueId } = req.params;
  const {
    entryFee,
    phone,
    tournamentName,
    organizer,
    details,
    sportsId,
    gameDay,
    registerEnds,
    totalTeams,
    gameEndDay,
    CourtId,
  } = req.body;

  if (
    !entryFee || !phone || !tournamentName || !sportsId || !gameDay ||
    !organizer || !details || !registerEnds || !totalTeams || !gameEndDay || !CourtId
  ) {
    return res.status(400).json({ message: "Missing required tournament details" });
  }

  // console.log("Received body:", req.body);


  try {
    const nepaliRegTime = moment(registerEnds).utcOffset(345);
    const nepaliGameTime = moment(gameDay).utcOffset(345);
    const nepaliGameEndTime = moment(gameEndDay).utcOffset(345);

    const registerEndsDate = nepaliRegTime.toDate();
    const gameDayDate = nepaliGameTime.startOf('day').toDate();
    const gameEndDayDate = nepaliGameEndTime.startOf('day').toDate();

    const venue = await prisma.venue.findUnique({
      where: { id: venueId },
      select: { title: true },
    });

    if (!venue) {
      return res.status(404).json({ message: "Venue not found" });
    }

    const tournament = await prisma.tournament.create({
      data: {
        venueId,
        courtId: CourtId, // ✅ Correct field name
        sportsId,
        entryFee: parseFloat(entryFee),
        phone,
        tournamentName,
        organizer,
        Details: details,
        gameDay: gameDayDate,
        registerEnds: registerEndsDate,
        gameEndDay: gameEndDayDate,
        totalTeams: parseInt(totalTeams, 10),
        isAvailable: true,
      },
    });


    // ⛔️ Block availability only for the selected court from gameDay to gameEndDay
    const currentDate = moment(gameDayDate);
    const endDate = moment(gameEndDayDate);

    while (currentDate.isSameOrBefore(endDate, "day")) {
      await prisma.availability.updateMany({
        where: {
          venueId,
          courtId: CourtId, // ✅ Only update this court
          date: {
            gte: currentDate.startOf('day').toDate(),
            lt: currentDate.endOf('day').toDate(),
          },
        },
        data: {
          isAvailable: false,
        },
      });
      currentDate.add(1, "day");
    }


    res.status(201).json({
      message: "Tournament created and availability blocked successfully",
      tournament: {
        ...tournament,
        venueName: venue.title,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create tournament", error });
  }
};


export const getTournamentById = async (req, res) => {
  const { venueId } = req.params;

  const nepalTime = moment().tz('Asia/Kathmandu').format('YYYY-MM-DD HH:mm:ss');


  try {
    // Fetch the tournaments for the given venueId
    const venueTournaments = await prisma.tournament.findMany({
      where: { venueId: venueId },
      include: {
        sports: {
          select: {
            name: true
          }
        }
      }
    });

    // Convert each tournament's registerEnds to Nepal Time
    const tournamentsWithNepalTime = venueTournaments.map((tournament) => {
      const registerEndsNepalTime = moment(tournament.registerEnds)
        .tz('Asia/Kathmandu')
        .format('YYYY-MM-DD'); // Convert and format registerEnds to Nepal Time

      const gameDayNepalTime = moment(tournament.gameDay)
        .tz('Asia/Kathmandu')
        .format('YYYY-MM-DD');

      const gameEndDayNepalTime = moment(tournament.gameEndDay)
        .tz('Asia/Kathmandu')
        .format('YYYY-MM-DD');

      return {
        ...tournament,
        registerEnds: registerEndsNepalTime,
        gameDay: gameDayNepalTime, // update the registerEnds field with Nepal Time
        gameEndDay: gameEndDayNepalTime
      };
    });

    res.status(200).json({
      message: "Fetched venue tournaments successfully",
      tournaments: tournamentsWithNepalTime,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to get tournaments" });
  }
};

export const getTournament = async (req, res) => {
  try {
    // Fetch tournaments where venue is approved (not pending)
    const venueTournaments = await prisma.tournament.findMany({
      where: {
        venue: {
          status: { not: "pending" }
        }
      },
      include: {
        venue: { select: { title: true } },
        sports: { select: { name: true } }
      }
    });

    // Get today's date in Nepal time, normalized to start of day
    const currentNepalTime = moment().tz('Asia/Kathmandu').startOf('day');

    // Filter and format tournaments with registerEnds after today
    const tournamentsWithNepalTime = venueTournaments
      .filter((tournament) => {
        const registerEndsDate = moment(tournament.registerEnds).tz('Asia/Kathmandu').startOf('day');
        return registerEndsDate.isAfter(currentNepalTime); // strictly after today
      })
      .map((tournament) => {
        const registerEndsNepalTime = moment(tournament.registerEnds)
          .tz('Asia/Kathmandu')
          .format('YYYY-MM-DD');

        const gameDayNepalTime = moment(tournament.gameDay)
          .tz('Asia/Kathmandu')
          .format('YYYY-MM-DD');

        const gameEndDayNepalTime = moment(tournament.gameEndDay)
          .tz('Asia/Kathmandu')
          .format('YYYY-MM-DD');

        return {
          ...tournament,
          registerEnds: registerEndsNepalTime,
          gameDay: gameDayNepalTime,
          gameEndDay: gameEndDayNepalTime
        };
      });

    res.status(200).json({
      message: "Fetched venue tournaments successfully",
      tournaments: tournamentsWithNepalTime
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get tournaments" });
  }
};




export const updateTournament = async (req, res) => {
  const { tournamentId } = req.params;
  const {
    tournamentName,
    organizer,
    entryFee,
    phone,
    details,
    sportsId,
    gameDay,
    registerEnds,
    gameEndDay,
    CourtId, // 👈 New selected court (optional)
  } = req.body;

  try {
    // 1. Get the existing tournament
    const existingTournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!existingTournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    // Convert existing dates
    const oldGameDay = moment(existingTournament.gameDay).startOf('day');
    const oldGameEndDay = moment(existingTournament.gameEndDay).startOf('day');
    const oldCourtId = existingTournament.court;

    // Prepare updated data
    const updateData = {};
    if (tournamentName) updateData.tournamentName = tournamentName;
    if (organizer) updateData.organizer = organizer;
    if (entryFee) updateData.entryFee = parseFloat(entryFee);
    if (phone) updateData.phone = phone;
    if (details) updateData.Details = details;
    if (sportsId) {
      updateData.sports = {
        connect: { id: sportsId },
      };
    }
    if (CourtId){

      updateData.court = {
        connect: { id: CourtId },
      };
    } 

    // Parse new dates if provided
    let newGameDay = oldGameDay;
    let newGameEndDay = oldGameEndDay;
    if (gameDay) {
      newGameDay = moment(gameDay).utcOffset(345).startOf('day');
      updateData.gameDay = newGameDay.toDate();
    }
    if (gameEndDay) {
      newGameEndDay = moment(gameEndDay).utcOffset(345).startOf('day');
      updateData.gameEndDay = newGameEndDay.toDate();
    }
    if (registerEnds) {
      updateData.registerEnds = moment(registerEnds).utcOffset(345).toDate();
    }

    // 2. Restore availability for OLD court
    const restoreDate = moment(oldGameDay);
    while (restoreDate.isSameOrBefore(oldGameEndDay)) {
      await prisma.availability.updateMany({
        where: {
          venueId: existingTournament.venueId,
          courtId: oldCourtId,
          date: {
            gte: restoreDate.startOf('day').toDate(),
            lt: restoreDate.endOf('day').toDate(),
          },
        },
        data: {
          isAvailable: true,
        },
      });
      restoreDate.add(1, 'day');
    }

    // 3. Block availability for NEW court
    const blockCourtId = CourtId || oldCourtId;
    const blockDate = moment(newGameDay);
    while (blockDate.isSameOrBefore(newGameEndDay)) {
      await prisma.availability.updateMany({
        where: {
          venueId: existingTournament.venueId,
          courtId: blockCourtId,
          date: {
            gte: blockDate.startOf('day').toDate(),
            lt: blockDate.endOf('day').toDate(),
          },
        },
        data: {
          isAvailable: false,
        },
      });
      blockDate.add(1, 'day');
    }

    // 4. Update tournament
    const updatedTournament = await prisma.tournament.update({
      where: { id: tournamentId },
      data: updateData,
    });

    res.status(200).json({
      message: "Tournament updated and availability adjusted successfully",
      tournament: updatedTournament,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update tournament", error });
  }
};

export const deleteTournament = async (req, res) => {
  const { tournamentId } = req.params;

  try {
    // 1. Find the tournament details
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: {
        venueId: true,
        court: { select: { id: true } },  // assuming 'court' is a relation, adjust if scalar
        gameDay: true,
        gameEndDay: true,
      },
    });

    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    // 2. Loop through dates from gameDay to gameEndDay and update availability
    const currentDate = moment(tournament.gameDay);
    const endDate = moment(tournament.gameEndDay);
    const courtId = tournament.court.id; // or tournament.court if it's scalar

    while (currentDate.isSameOrBefore(endDate, "day")) {
      await prisma.availability.updateMany({
        where: {
          venueId: tournament.venueId,
          courtId: courtId,
          date: {
            gte: currentDate.startOf('day').toDate(),
            lt: currentDate.endOf('day').toDate(),
          },
        },
        data: {
          isAvailable: true, // Free the slot again
        },
      });
      currentDate.add(1, "day");
    }

    // 3. Delete the tournament
    await prisma.tournament.delete({
      where: { id: tournamentId },
    });

    res.status(200).json({ message: "Tournament deleted and availability updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete tournament", error });
  }
};


export const getTournamentsByUserId = async (req, res) => {
  const userId = req.userId;

  try {
    const userRegisteredTournament = await prisma.registeredTournamentTeam.findMany({
      where: { userId: userId },
      include: {
        tournament: {
          include: {
            venue: { select: { title: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const tournamentsWithNepalTime = userRegisteredTournament
      .filter((item) => item.tournament) // ❗ Ensure tournament is not null
      .map((item) => {
        const registerEndsNepalTime = moment(item.tournament.registerEnds)
          .tz('Asia/Kathmandu')
          .format('YYYY-MM-DD');

        const gameDayNepalTime = moment(item.tournament.gameDay)
          .tz('Asia/Kathmandu')
          .format('YYYY-MM-DD');

        return {
          ...item,
          tournament: {
            ...item.tournament,
            registerEnds: registerEndsNepalTime,
            gameDay: gameDayNepalTime
          }
        };
      });

    res.status(200).json({
      message: "Fetched venue tournaments successfully",
      tournaments: tournamentsWithNepalTime
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get user tournaments' });
  }
};



