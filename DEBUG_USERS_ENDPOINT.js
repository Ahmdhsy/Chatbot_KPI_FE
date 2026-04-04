/**
 * Quick debug script to test the users endpoint
 * Run this in browser console on any page with access token
 */

(async () => {
  const token = localStorage.getItem("accessToken");
  console.log("📌 Testing users endpoint...");
  console.log("Token:", token ? `${token.substring(0, 20)}...` : "❌ NO TOKEN FOUND");

  if (!token) {
    console.error("❌ No access token found! Please login first.");
    return;
  }

  // Test 1: With skip/limit
  console.log("\n🔍 Test 1: With skip/limit params");
  try {
    const res1 = await fetch("http://localhost:8000/api/v1/users/users?skip=0&limit=20", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    console.log(`Status: ${res1.status}`);
    const data1 = await res1.json();
    console.log("Response:", data1);
  } catch (e) {
    console.error("Error:", e?.message);
  }

  // Test 2: Without params
  console.log("\n🔍 Test 2: Without params");
  try {
    const res2 = await fetch("http://localhost:8000/api/v1/users/users", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    console.log(`Status: ${res2.status}`);
    const data2 = await res2.json();
    console.log("Response:", data2);
  } catch (e) {
    console.error("Error:", e?.message);
  }

  // Test 3: With limit/offset
  console.log("\n🔍 Test 3: With limit/offset params");
  try {
    const res3 = await fetch("http://localhost:8000/api/v1/users/users?limit=20&offset=0", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    console.log(`Status: ${res3.status}`);
    const data3 = await res3.json();
    console.log("Response:", data3);
  } catch (e) {
    console.error("Error:", e?.message);
  }
})();
