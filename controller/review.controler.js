import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const reviewVenue = async (req, res) => {
  const userId = req.userId;
  const { venueId } = req.params;
  const { review, rating } = req.body;

  try {
    const newReview = await prisma.venueReviewAndRating.create({
      data: {
        userId: userId,
        venueId: venueId,
        review: review,
        rating: rating
      }
    });

    res.status(200).json({ message: "Reviewed and rated successfully", review: newReview });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to post review and rating", error });
  }
};

export const getReview = async(req,res)=>{
  const {venueId} = req.params;

  try {
    const reviews = await prisma.venueReviewAndRating.findMany({
      where:{venueId:venueId}
    })

    res.status(200).json({message:"Fetched reviews & ratings",reviews})

  } catch (error) {
    console.log(error);
    res.status(500).json({message:"Failed to fetch Review",error})
  }
}


export const deleteReview = async (req, res) => {
  const userId = req.userId;
  const { reviewId } = req.params; // assuming reviewId is sent in the URL

  try {
    const review = await prisma.venueReviewAndRating.findUnique({
      where: { id: reviewId }
    });

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (review.userId !== userId) {
      return res.status(403).json({ message: "Not authorized to delete this review" });
    }

    await prisma.venueReviewAndRating.delete({
      where: { id: reviewId }
    });

    res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete review and rating" });
  }
};


export const updateReview = async (req, res) => {
  const userId = req.userId;
  const { reviewId } = req.params; // assuming reviewId is sent in the URL
  const { review, rating} = req.body

  try {
    const userReview = await prisma.venueReviewAndRating.findUnique({
      where: { id: reviewId }
    });

    if (!userReview) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (userReview.userId !== userId) {
      return res.status(403).json({ message: "Not authorized to update this review" });
    }

    const updateReview=await prisma.venueReviewAndRating.update({
      where: { id: reviewId },
      data:{
        review,
        rating
      }
    });

    res.status(200).json({ message: "Review updated successfully",updateReview });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update review and rating" });
  }
};
