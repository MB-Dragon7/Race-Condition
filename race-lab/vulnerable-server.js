// VULNERABLE coupon redemption server — deliberately insecure, for learning.
// Simulates a real-world pattern: check eligibility, do some slow work
// (like calling a payment gateway), THEN mark it as used. The gap between
// check and write is the race window.

const express = require("express");
const app = express();
app.use(express.json());

const store = {
  coupon: "WELCOME10",
  maxRedemptions: 1,   // intended: only ONE redemption allowed, ever
  redemptions: 0,
  balance: 0,
  rewardPerRedeem: 100,
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

app.post("/redeem", async (req, res) => {
  const { code } = req.body || {};
  if (code !== store.coupon) {
    return res.status(400).json({ error: "Invalid coupon code." });
  }

  // --- CHECK ---
  if (store.redemptions >= store.maxRedemptions) {
    return res.status(400).json({ error: "Coupon already redeemed." });
  }

  // --- SIMULATED SLOW WORK (e.g. calling a payment/rewards gateway) ---
  // This is the race window: many requests can pass the check above
  // BEFORE any of them reaches the write below.
  await sleep(200);

  // --- WRITE (too late — the damage is already done) ---
  store.redemptions += 1;
  store.balance += store.rewardPerRedeem;

  return res.json({
    success: true,
    message: `Coupon redeemed! +${store.rewardPerRedeem} credited.`,
    totalRedemptions: store.redemptions,
    balance: store.balance,
  });
});

app.get("/status", (req, res) => {
  res.json(store);
});

const PORT = process.env.PORT || 4500;
app.listen(PORT, () => console.log(`Vulnerable coupon server running on port ${PORT}`));
