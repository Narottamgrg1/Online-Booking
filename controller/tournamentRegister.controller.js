import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const registerTournament = async (req, res) => {
  const userId = req.userId;
  const { tournamentId } = req.params;
  const { teamName, phone } = req.body;

  try {
    // 1. Get tournament details including totalTeams
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { totalTeams: true },
    });

    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found." });
    }

    // 2. Count current registered teams
    const registeredCount = await prisma.registeredTournamentTeam.count({
      where: { tournamentId },
    });

    // 3. Check if tournament is full
    if (registeredCount >= tournament.totalTeams) {
      return res.status(400).json({ message: "Registration full. No more teams can be registered." });
    }

    // 4. Proceed with registration
    const registerUser = await prisma.registeredTournamentTeam.create({
      data: {
        tournamentId,
        teamName,
        phone,
        userId,
        paymentGateway: 'khalti', // required field
        // registrationStatus & paymentStatus use defaults
      },
    });

    res.status(201).json({
      message: "Successfully registered team",
      data: registerUser,
    });
  } catch (error) {
    console.error(error);
    if (error.code === 'P2002') {
      res.status(400).json({ message: "A team with this name already exists for the tournament." });
    } else {
      res.status(500).json({ message: "Failed to register team." });
    }
  }
};


 export const cancelRegistration = async (req, res) => {
  const userId = req.userId;
  const { registrationId } = req.params; // ✅ destructure properly

  try {
    const getRegistration = await prisma.registeredTournamentTeam.findUnique({
      where: { id: registrationId },
    });

    if (!getRegistration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    if (getRegistration.userId !== userId) {
      return res.status(403).json({ message: "You are not authorized to cancel this registration" });
    }

    await prisma.registeredTournamentTeam.delete({
      where: { id: registrationId },
    });

    return res.status(200).json({ message: "Registration cancelled successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to cancel your registration" });
  }
};


  export const getRegisterTeam=async(req,res)=>{
    const {tournamentId} = req.params;

    try {
        
        const registeredTeam = await prisma.registeredTournamentTeam.findMany({
            where:{tournamentId:tournamentId},
            include: {
                user: { // ✅ include related venue
                  select: { name: true } // ✅ only fetch the title field
                }
              }
        }) 

        res.status(200).json({
            message:"Fetched registered team successfully.",
            registeredTeam

        })
        
    } catch (error) {
        console.log(error);
        res.status(500).json({message:"Failed to fetch registered team."})   
    }
  }
  