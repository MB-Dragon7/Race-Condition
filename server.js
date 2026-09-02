// VULNERABLE storefront server — deliberately insecure, for learning.
// Scenario: apply a one-time coupon code to get a discount on checkout.
// The /api/apply-coupon endpoint has a classic TOCTOU race condition —
// it checks "has this coupon already been used?", does some slow work
// (simulating a call to a pricing/validation service), and only THEN
// marks it as used. Firing many concurrent requests lets multiple
// discounts stack before the "already used" flag is set.

const express = require("express");
const path = require("path");
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const ORIGINAL_PRICE = 6499;
const DISCOUNT_AMOUNT = 1500;
const VALID_COUPON = "FESTIVE20";
const MAX_APPLIES = 1;

let state = {
  price: ORIGINAL_PRICE,
  couponApplyCount: 0,
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

app.get("/api/cart-status", (req, res) => {
  res.json({ price: state.price, couponApplyCount: state.couponApplyCount, maxApplies: MAX_APPLIES });
});

app.post("/api/apply-coupon", async (req, res) => {
  const { code } = req.body || {};
  if (code !== VALID_COUPON) {
    return res.status(400).json({ error: "Invalid coupon code." });
  }

  // --- CHECK ---
  if (state.couponApplyCount >= MAX_APPLIES) {
    return res.status(400).json({ error: "This coupon has already been used on this order." });
  }

  // --- SIMULATED SLOW WORK (e.g. calling a pricing/validation service) ---
  await sleep(250);

  // --- WRITE (too late) ---
  state.couponApplyCount += 1;
  state.price = Math.max(0, state.price - DISCOUNT_AMOUNT);

  return res.json({
    success: true,
    price: state.price,
    couponApplyCount: state.couponApplyCount,
  });
});

// Convenience reset so you can re-run the demo without redeploying.
app.post("/api/reset", (req, res) => {
  state = { price: ORIGINAL_PRICE, couponApplyCount: 0 };
  res.json({ ok: true, ...state });
});
app.get("/api/reset", (req, res) => {
  state = { price: ORIGINAL_PRICE, couponApplyCount: 0 };
  res.json({ ok: true, ...state });
});

const PORT = process.env.PORT || 4500;
app.listen(PORT, () => console.log(`Storefront running on port ${PORT}`));
