import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const bookResult = async(req,res)=>{
    const {bookId}= req.params;

    try {
        const booking = await prisma.courtBook.findUnique({
            where:{id:bookId}
        })

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
          }
      
          // Logic for khalti
          if (booking.paymentMethod === 'khalti') {
            if (booking.paymentStatus !== 'success') {
              return res.status(400).json({ message: "Payment not completed yet for Khalti" });
            }
          } 
          // Logic for cash
          else if (booking.paymentMethod !== 'cash') {
            return res.status(400).json({ message: "Unsupported payment method" });
          }
      
          // Generate 4-digit code
          const code = Math.floor(1000 + Math.random() * 9000).toString();
      
          // Update booking with verification code
          const updatedBooking = await prisma.courtBook.update({
            where: { id: bookId },
            data: { verificationCode: code },
          });
      
          res.status(200).json({
            message: "Verification code generated",
            verificationCode: code,
            booking: updatedBooking,
          });

    } catch (error) {
        console.log(error);
        
        res.status(500).json({message:"Failed to load result",error})
    }
}