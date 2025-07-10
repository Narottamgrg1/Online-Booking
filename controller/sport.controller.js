import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const addSport = async (req, res) => {
  const { name } = req.body;

  // Validate input
  if (!name) {
    return res.status(400).json({ message: "Sport name is required" });
  }

  try {
    // Check if the sport already exists (case-insensitive)
    const existingSport = await prisma.sports.findFirst({
      where: {
        name: {
          equals: name,  // Perform case-insensitive search
          mode: 'insensitive',  // Case-insensitive comparison
        },
      },
    });

    if (existingSport) {
      return res.status(400).json({ message: "Sport with this name already exists" });
    }

    // Create a new sport if it doesn't exist
    const newSport = await prisma.sports.create({
      data: {
        name,
      },
    });

    res.status(201).json(newSport);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error adding new sport" });
  }
};




export const sport = async (req, res) => {
    try {
      // Fetch all sports from the database
      const sports = await prisma.sports.findMany();
  
      // Return sports data as a response
      res.status(200).json(sports);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error fetching sports data" });
    }
  };


  export const deleteSports = async (req, res) => {
  const id = req.userId;
  // Expecting a list of sport IDs to delete
    const { ids } = req.body;

  try {
    const admin = await prisma.user.findUnique({
      where: { id: id },
    });

    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized" });
    }

    

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No sport IDs provided" });
    }

    const deleted = await prisma.sports.deleteMany({
      where: {
        id: { in: ids },
      },
    });

    res.status(200).json({
      message: "Sports deleted successfully",
      count: deleted.count,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete sports", error });
  }
};

