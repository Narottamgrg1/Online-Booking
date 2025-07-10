import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const cashPayment = async (req, res) => {
  const { bookId } = req.params;
  const { paymentMethod } = req.body; // expected to be 'cash'

  try {
    if (paymentMethod !== "cash") {
      return res.status(400).json({ message: "Invalid payment status" });
    }

    const booking = await prisma.courtBook.update({
      where: { id: bookId },
      data: {
        paymentMethod: 'cash',
        paymentDate: new Date(),
      },
    });

    res.status(200).json({
      message: "Cash payment recorded successfully",
      booking,
    });
  } catch (error) {
    console.error("Cash payment error:", error);
    res.status(500).json({ message: "Payment error", error: error.message });
  }
};

export const cashSuccess = async (req, res) => {
  const { bookId } = req.params;
  const { paymentStatus } = req.body;

  if (!paymentStatus || !["success", "pending", "failed"].includes(paymentStatus)) {
    return res.status(400).json({ message: "Invalid payment status" });
  }

  try {
    const booking = await prisma.courtBook.update({
      where: { id: bookId },
      data: { paymentStatus },
    });

    res.status(200).json({ message: "Payment status updated successfully.", booking });
  } catch (error) {
    if (error.code === 'P2025') { // Prisma not found error
      return res.status(404).json({ message: "Booking not found." });
    }
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

