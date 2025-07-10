import { PrismaClient } from '@prisma/client';
// import { sport } from './sport.controller';

const prisma = new PrismaClient();

export const createChallenge = async (req, res) => {
    const userId = req.userId;  // Assuming the user ID comes from the request (e.g., from a JWT token)
    const {bookId} = req.params;
    const { details, courtId, venueId } = req.body;
    
    if (!userId || !details || !bookId || !courtId || !venueId) {
        return res.status(400).json({ message: "Missing required fields." });
    }

    try {


        const challenge = await prisma.challenge.create({
            data: {
                details,
                firstUserId: userId,  // Correctly passing the first user's ID
                bookId:bookId,
                courtId,
                venueId
            }
        });

        if (!challenge || !challenge.id) {
            console.error("❌ Challenge creation returned null or invalid object");
            return res.status(500).json({ message: "Challenge not created." });
        }

        res.status(201).json(challenge);  // Respond with the created challenge
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Failed to create Challenge' });
    }
};

export const getChallenge = async (req, res) => {
  const { venueId } = req.params;

  try {
    const challenges = await prisma.challenge.findMany({
      where: { 
        venueId: venueId,
        booking:{
          status:{not:"PENDING"}
        },
        challengestatus:{not:"cancelled"},
       },
       orderBy: {
    createdAt: 'desc'  // <-- Show latest first
  },
      
      include: {
        firstUser: {
          select: {
            name: true,
            Phone: true,  // Make sure your User model field is exactly "Phone"
            avatar:true
          },
        },
        secondUser: {
          select: {
            name: true,
            Phone: true,  // Make sure your User model field is exactly "Phone"
            avatar:true
          },
        },
        
        court: {
          select: {
            sportname: true,
            title: true,
          },
        },
        booking: {
          select: {
            starting_hour: true,
            ending_hour: true,
            duration: true,
            price: true,
            paymentMethod: true,
            date:true
          },
        },
      },
    });

    if (challenges.length === 0) {
      return res.status(404).json({ message: "No challenges found for this venue" });
    }

    res.status(200).json({ message: "Challenges Fetched", challenges });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to fetch challenges" });
  }
};


export const acceptChallenge = async (req, res) => {
  const { challengeId } = req.params;
  const userId = req.userId;

  try {
    // Fetch the challenge
    const checkChallenge = await prisma.challenge.findUnique({
      where: { id: challengeId }
    });

    // Check if challenge exists
    if (!checkChallenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }

    // Prevent same user from accepting their own challenge
    if (checkChallenge.firstUserId === userId) {
      return res.status(403).json({ message: "Cannot accept your own challenge" });
    }

    // Check if challenge is open
    if (checkChallenge.challengestatus !== "open") {
      return res.status(400).json({ message: "Challenge is not open for acceptance" });
    }

    // Update the challenge to accepted
    const updatedChallenge = await prisma.challenge.update({
      where: { id: challengeId },
      data: {
        secondUserId: userId,
        challengestatus: "accepted",
      }
    });

    res.status(200).json({
      message: "Challenge accepted successfully",
      challenge: updatedChallenge
    });
  } catch (error) {
    console.error("Error accepting challenge:", error);
    res.status(500).json({ message: "Failed to accept challenge" });
  }
};


