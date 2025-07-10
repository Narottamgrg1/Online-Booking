// backend/routes/paymentRoute.js
import express from 'express';
import khaltiService from '../lib/khalti.js';
import { PrismaClient } from '@prisma/client';
import { cashPayment, cashSuccess } from '../controller/payment.controller.js';
import { createOrUpdateLoyaltyPoints } from '../lib/loyalty.js';

const prisma = new PrismaClient();
const router = express.Router();

// Initialize Khalti Payment
router.post('/initialize-khalti', async (req, res) => {
  try {
    const { bookingId, totalPrice, website_url } = req.body;

    if (!bookingId || !totalPrice || !website_url) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const booking = await prisma.courtBook.findUnique({
      where: { id: bookingId },
      include: { user: true },
    });

    if (!booking || booking.price !== totalPrice) {
      return res.status(400).json({ success: false, message: 'Booking not found or price mismatch' });
    }

    if (!booking.user) {
      return res.status(400).json({ success: false, message: 'No user linked to this booking' });
    }

    const customerInfo = {
      name: booking.user.name,
      email: booking.user.email,
      phone: booking.user.Phone,
    };

    const paymentInitiate = await khaltiService.initializeKhaltiPayment({
      amount: totalPrice,
      purchase_order_id: bookingId,
      purchase_order_name: `Court Booking #${bookingId}`,
      return_url: `http://localhost:8800/api/payment/complete-khalti-payment?bookingId=${bookingId}`,
      website_url,
      user: customerInfo,
    });

    res.json({
      success: true,
      booking,
      payment: paymentInitiate,
    });

  } catch (error) {
    console.error('Initialize Error:', error.response?.data || error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/complete-khalti-payment', async (req, res) => {
    const { pidx, bookingId } = req.query;
  
    try {
      if (!pidx || !bookingId) {
        return res.status(400).json({ success: false, message: 'Missing pidx or bookingId' });
      }
  
      const paymentInfo = await khaltiService.verifyKhaltiPayment(pidx);
  
      if (paymentInfo?.status !== 'Completed') {
        return res.status(400).json({ success: false, message: 'Payment not completed' });
      }
  
      const amount = paymentInfo.total_amount / 100; // paisa to rupees
  
      const booking = await prisma.courtBook.findUnique({
        where: { id: bookingId },
      });
  
      if (!booking) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }
  
      // Save Payment
      const payment = await prisma.payment.create({
        data: {
          pidx,
          transactionId: paymentInfo.transaction_id,
          bookingId: bookingId,
          amount: amount,
          paymentGateway: 'khalti',
          status: 'success',
          paymentDate: new Date(),
          dataFromVerificationReq: paymentInfo,
        },
      });
  
      // Update Booking
      await prisma.courtBook.update({
        where: { id: bookingId },
        data: {
          paymentStatus: 'success',
          paymentMethod: 'khalti',
          paymentDate: new Date(),
        },
      });
      await createOrUpdateLoyaltyPoints(booking.userId, booking.id, booking.venueId);
  
      // ✅ Redirect to frontend
      res.redirect(`${process.env.CLIENT_URL}/user/result/${bookingId}`);
  
    } catch (error) {
      console.error('Complete Error:', error.response?.data || error);
      res.status(500).json({ success: false, message: 'Verification error', error: error.message });
    }
  });

  router.put("/paymentoncash/:bookId",cashPayment);

  router.put("/updatepayment/:bookId",cashSuccess);
  
export default router;
