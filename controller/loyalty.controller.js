import { PrismaClient, LoyaltyStatus, PaymentGateway, PaymentStatus } from '@prisma/client';

const prisma = new PrismaClient();

export const createLoyalty = async (req, res) => {
    const userId = req.userId;
    const { courtId } = req.params;

    try {
        const booking = await prisma.courtBook.findUnique({
            where: { id: courtId },
        });

        if (!booking) {
            return res.status(404).json({ message: "Booking not found." });
        }

        const venueId = booking.venueId;

        if (
            booking.userId !== userId ||
            booking.paymentStatus !== 'khalti'
        ) {
            return res.status(403).json({ message: "Unauthorized or unpaid booking." });
        }

        const existing = await prisma.loyalty.findFirst({
            where: { userId, venueId },
        });

        if (existing) {
            const updatedLoyalty = await prisma.loyalty.update({
                where: { id: existing.id },
                data: {
                    points: { increment: 1 },
                },
            });
            return res.status(200).json({ message: "Loyalty updated!", loyalty: updatedLoyalty });
        } else {
            const newLoyalty = await prisma.loyalty.create({
                data: {
                    venueId,
                    userId,
                    points: 1,
                    status: LoyaltyStatus.ACTIVE,
                },
            });

            return res.status(201).json({ message: "Loyalty created!", loyalty: newLoyalty });
        }

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to create loyalty.", error });
    }
};

export const getLoyaltyOfUser = async (req, res) => {
    const userId = req.userId;

    try {
        const card = await prisma.loyalty.findMany({
            where: { userId: userId },
            include: {
                venue: {
                    select: {
                        id: true,
                        title: true,
                        loyaltyPoint: true
                    }
                },
                user: {
                    select: {
                        name: true,
                        email: true,
                        Phone: true,
                        avatar: true
                    }
                }
            }
        })

        res.status(200).json({ message: "Loyalty card loaded successfully.", card })

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Failed to load loyalty card!", error })
    }
}

export const getLoyaltyForVenue = async (req, res) => {
    const { venueId } = req.params;

    try {
        const card = await prisma.loyalty.findMany({
            where: { venueId: venueId },
            include: {
                venue: {
                    select: {
                        title: true,
                        loyaltyPoint: true
                    }
                },
                user: {
                    select: {
                        name: true,
                        email: true,
                        Phone: true
                    }
                }
            }
        })

        res.status(200).json({ message: "Loyalty card loaded successfully.", card })

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Failed to load loyalty card!", error })
    }
}

export const getLoyalty = async (req, res) => {
    const userId = req.userId;
    const {venueId} = req.params;

    try {
        const card = await prisma.loyalty.findFirst({
            where: {
                venueId: venueId,
                userId: userId,
                status: "ACTIVE",
            },
            include:{
                venue:{select:{loyaltyPoint:true}}
            }
        })
        res.status(200).json({message:"Loyalty loaded successfully.",card})

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Failed to load Loyalty" })
    }

}


export const redeemLoyalty = async (req, res) => {
    const userId = req.userId;
    const { venueId, courtId } = req.params;

    try {
        const venue = await prisma.venue.findUnique({
            where: { id: venueId },
        });

        if (!venue || !venue.loyaltyCard) {
            return res.status(400).json({ message: "Venue does not support loyalty." });
        }

        const maxLoyaltyPoint = venue.loyaltyPoint;


        const loyaltyCard = await prisma.loyalty.findFirst({
            where: {
                venueId: venueId,
                userId: userId,
                status: LoyaltyStatus.ACTIVE,
            },
        });

        if (!loyaltyCard) {
            return res.status(404).json({ message: "Active loyalty card not found." });
        }

        if (loyaltyCard.points >= maxLoyaltyPoint) {

            await prisma.courtBook.update({
                where: { id: courtId },
                data: {
                    paymentStatus: PaymentStatus.success,
                    paymentMethod: PaymentGateway.Redeemtion
                }
            })

            await prisma.loyalty.update({
                where: { id: loyaltyCard.id },
                data: {
                    status: LoyaltyStatus.REDEEMED,
                },
            });

            return res.status(200).json({ message: "Loyalty redeemed!" });
        } else {
            return res.status(400).json({ message: "Not enough loyalty points to redeem." });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to redeem loyalty!", error });
    }
};