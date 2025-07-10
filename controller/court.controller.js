// Importing required dependencies
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

  export const getCourtsByVenueId = async (req, res) => {
      const { venueId } = req.params; // Corrected: Remove `.id` from `req.params`
  
      try {
          const courts = await prisma.venueCourt.findMany({
              where: { 
                  venueId,
                  status: { not: "Unavailable" } // Exclude courts where status is "unavailable"
              },
              select: {
                  id: true,
                  title: true,
                  price_per_hour: true,
                  status: true,
                  sportname: true
              }
          });
  
          if (courts.length === 0) {
              return res.status(404).json({ message: "No available courts found!" });
          }
  
          res.json(courts);
      } catch (err) {
          console.error("Error fetching courts:", err);
          res.status(500).json({ message: "Failed to fetch courts" });
      }
  };
  


  export const getCourt = async (req, res) => {
    const id = req.params.id; // Extract courtId from request parameters

    try {
        const court = await prisma.venueCourt.findUnique({
            where: { id },
            select: {
                id: true,
                title: true,
                price_per_hour: true,
                sportname: true
            }
        });

        if (!court) {
            return res.status(404).json({ message: "Court not found!" });
        }

        res.json(court);
    } catch (error) {
        console.error("Error fetching court details:", error);
        res.status(500).json({ message: "Failed to fetch court details" });
    }
};

export const deleteCourt =async(req,res)=>{
    // const {venueId} = req.params;
    const {courtId} = req.body;

    try {

        await prisma.availability.deleteMany({
            where:{courtId}
        })

        await prisma.venueCourt.delete({
            where:{id:courtId}
        })

        
        res.status(200).json({message:"Court deleted successfully."})
        
    } catch (error) {
        console.log(error);
        res.status(500).json({message:"Failed to delete Court",error})
    }
}

