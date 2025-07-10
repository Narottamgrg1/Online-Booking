import { PrismaClient, LoyaltyStatus } from '@prisma/client';
const prisma = new PrismaClient();

export async function createOrUpdateLoyaltyPoints(userId, courtId, venueId) {
  const venue = await prisma.venue.findUnique({
    where: { id: venueId },
  });

  if (!venue?.loyaltyCard) {
    console.log("Venue does not have loyalty feature.");
    return null;
  }

  const booking = await prisma.courtBook.findUnique({
    where: { id: courtId },
  });

  if (!booking) {
    throw new Error("Booking not found.");
  }

  if (
    booking.userId !== userId ||
    booking.paymentMethod !== 'khalti'
  ) {
    throw new Error("Unauthorized or unpaid booking.");
  }

  const existing = await prisma.loyalty.findFirst({
    where: { userId, venueId },
    orderBy: { updatedAt: 'desc' }, // get the latest one
  });

  if (existing) {
    if (existing.status === LoyaltyStatus.REDEEMED) {
      // ✅ Create a new loyalty card after redemption
      const newLoyalty = await prisma.loyalty.create({
        data: {
          venueId,
          userId,
          points: 1,
          status: LoyaltyStatus.ACTIVE,
        },
      });
      return newLoyalty;
    } else {
      // ✅ Update existing active card
      const updatedLoyalty = await prisma.loyalty.update({
        where: { id: existing.id },
        data: {
          points: { increment: 1 },
          updatedAt: new Date(),
        },
      });
      return updatedLoyalty;
    }
  } else {
    // ✅ No record found, create new
    const newLoyalty = await prisma.loyalty.create({
      data: {
        venueId,
        userId,
        points: 1,
        status: LoyaltyStatus.ACTIVE,
      },
    });
    return newLoyalty;
  }
}
