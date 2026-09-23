const name = process.argv[2];
const email = process.argv[3];
const password = process.argv[4];
const role = process.argv[5] || 'Agent'; // Admin, Agent, or Customer

if (!name || !email || !password) {
  console.log("==================================================================");
  console.log("               AuraGuard Accounts Creator Tool                   ");
  console.log("==================================================================");
  console.log("Usage: node create-user.js <name> <email> <password> [role]");
  console.log("\nRoles allowed: Admin | Agent | Customer");
  console.log("\nExamples:");
  console.log("  node create-user.js \"System Admin\" \"admin2@insurance.com\" \"pass123\" \"Admin\"");
  console.log("  node create-user.js \"Insurance Agent\" \"agent2@insurance.com\" \"pass123\" \"Agent\"");
  console.log("==================================================================");
  process.exit(1);
}

fetch('http://localhost:5000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name, email, password, role })
})
.then(res => res.json().then(data => ({ status: res.status, data })))
.then(({ status, data }) => {
  if (status === 200) {
    console.log(`\n✅ Account created successfully!`);
    console.log(`----------------------------------`);
    console.log(`Name:     ${name}`);
    console.log(`Email:    ${email}`);
    console.log(`Role:     ${role}`);
    console.log(`----------------------------------`);
    console.log(`You can now log in at http://localhost:5173/login`);
  } else {
    console.error(`\n❌ Registration failed (${status}):`, data.message || data);
  }
})
.catch(err => {
  console.error("\n❌ Error connecting to backend server.");
  console.error("Make sure your backend API service is running on http://localhost:5000.");
});
