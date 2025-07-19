// Helper function to check refund status
export const checkRefundStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    let paymentIntentId;
    
    // Handle different transaction ID formats
    if (payment.transactionId.startsWith('cs_')) {
      const session = await stripe.checkout.sessions.retrieve(payment.transactionId);
      paymentIntentId = session.payment_intent;
    } else if (payment.transactionId.startsWith('pi_')) {
      paymentIntentId = payment.transactionId;
    } else {
      return res.status(400).json({ message: "Invalid transaction ID format" });
    }

    // Get payment intent details
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    // Get all refunds for this payment
    const refunds = await stripe.refunds.list({
      payment_intent: paymentIntentId,
      limit: 10
    });

    const refundSummary = refunds.data.map(refund => ({
      id: refund.id,
      amount: refund.amount / 100,
      status: refund.status,
      created: new Date(refund.created * 1000).toISOString(),
      reason: refund.reason
    }));

    const totalRefunded = refunds.data.reduce((sum, refund) => {
      if (refund.status === 'succeeded') {
        return sum + refund.amount;
      }
      return sum;
    }, 0);

    return res.status(200).json({
      paymentIntent: {
        id: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        status: paymentIntent.status,
        currency: paymentIntent.currency
      },
      localPaymentStatus: payment.status,
      refunds: refundSummary,
      totalRefunded: totalRefunded / 100,
      fullyRefunded: totalRefunded >= paymentIntent.amount,
      canRefund: totalRefunded < paymentIntent.amount
    });

  } catch (error) {
    console.error("❌ Error checking refund status:", error);
    res.status(500).json({ message: error.message });
  }
};

// Helper function to sync payment status with Stripe
export const syncPaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    let paymentIntentId;
    
    if (payment.transactionId.startsWith('cs_')) {
      const session = await stripe.checkout.sessions.retrieve(payment.transactionId);
      paymentIntentId = session.payment_intent;
    } else if (payment.transactionId.startsWith('pi_')) {
      paymentIntentId = payment.transactionId;
    } else {
      return res.status(400).json({ message: "Invalid transaction ID format" });
    }

    // Get refunds from Stripe
    const refunds = await stripe.refunds.list({
      payment_intent: paymentIntentId,
      limit: 10
    });

    const successfulRefunds = refunds.data.filter(refund => refund.status === 'succeeded');
    
    if (successfulRefunds.length > 0 && payment.status !== 'refunded') {
      // Update local payment record
      payment.status = 'refunded';
      payment.refundId = successfulRefunds[0].id;
      payment.refundDate = new Date();
      await payment.save();
      
      console.log("🔄 Payment status synced with Stripe");
    }

    return res.status(200).json({
      message: "Payment status synced",
      payment: payment,
      stripeRefunds: successfulRefunds.length
    });

  } catch (error) {
    console.error("❌ Error syncing payment status:", error);
    res.status(500).json({ message: error.message });
  }
};