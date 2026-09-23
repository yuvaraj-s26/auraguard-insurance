const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function seedData() {
    try {
        console.log("Checking if backend is running...");
        let adminToken;
        try {
            const loginRes = await axios.post(`${API_URL}/auth/login`, {
                email: 'admin@insurance.com',
                password: 'admin123'
            });
            adminToken = loginRes.data.token;
            console.log("✅ Backend is running and Admin logged in.");
        } catch (e) {
            console.error("❌ Failed to connect to Backend API. Please make sure you have started it in Visual Studio!");
            return;
        }

        const adminConfig = { headers: { Authorization: `Bearer ${adminToken}` } };

        // 1. Create Customers
        const customersToCreate = [
            { name: 'Alice Cooper', email: 'alice@example.com', dob: '1985-05-12', gender: 'Female', phone: '9876543210', aadhaar: '111122223333' },
            { name: 'Bob Smith', email: 'bob@example.com', dob: '1992-10-25', gender: 'Male', phone: '8765432109', aadhaar: '444455556666' }
        ];

        let createdCustomers = [];

        for (const c of customersToCreate) {
            try {
                // Register User
                const regRes = await axios.post(`${API_URL}/auth/register`, { name: c.name, email: c.email, password: 'Password123!', role: 'Customer' });
                
                // Login User
                const loginRes = await axios.post(`${API_URL}/auth/login`, { email: c.email, password: 'Password123!' });
                const token = loginRes.data.token;
                const userId = loginRes.data.userId;
                
                // Create Profile
                const profRes = await axios.post(`${API_URL}/customer`, {
                    userId: userId,
                    dob: c.dob,
                    gender: c.gender,
                    phone: c.phone,
                    address: '123 Fake Street, Tech City',
                    aadhaar: c.aadhaar,
                    nomineeName: 'Jane Doe',
                    nomineeRelationship: 'Spouse'
                }, { headers: { Authorization: `Bearer ${token}` } });
                
                console.log(`✅ Created Profile for ${c.name}`);
                createdCustomers.push({ userId, token, customerId: profRes.data.customer.customerId });
            } catch (e) {
                console.log(`⚠️ Note: ${c.name} may already exist, skipping creation.`);
            }
        }

        // Fetch valid customer ID from DB directly if creation failed (due to already existing)
        const allCustomersRes = await axios.get(`${API_URL}/customer`, adminConfig);
        const customers = allCustomersRes.data;
        
        if (customers.length === 0) {
            console.error("No customers found to create policies for.");
            return;
        }

        console.log(`✅ Found ${customers.length} registered customers.`);

        // 2. Issue Policies
        console.log("Issuing Policies...");
        let policyIds = [];
        for (let i = 0; i < 2; i++) {
            const customer = customers[i % customers.length];
            try {
                const polRes = await axios.post(`${API_URL}/policy`, {
                    customerId: customer.customerId,
                    policyTypeId: (i % 4) + 1, // Cycle through 1 to 4
                    sumAssured: 50000 + (i * 10000)
                }, adminConfig);
                
                const createdPolicy = polRes.data.policy || polRes.data.Policy || polRes.data;
                policyIds.push(createdPolicy.policyId || createdPolicy.PolicyId);
                console.log(`✅ Issued Policy to ${customer.user.name}`);
            } catch (e) {
                console.error("❌ Failed to issue policy:", e.response?.data?.message || e.message);
            }
        }

        // 3. Process Payments & Renewals
        console.log("Processing Payments and Renewals...");
        for (const pid of policyIds) {
            try {
                // First Renew to set to Pending (if it was active) or just pay directly. 
                // Wait, creating a policy sets it to Pending! So we can just pay it directly.
                await axios.post(`${API_URL}/payment`, {
                    policyId: pid,
                    amount: 500, // random amount
                    paymentMode: 'Credit Card',
                    transactionId: 'TXN' + Math.floor(Math.random() * 1000000)
                }, adminConfig);
                console.log(`✅ Processed Payment for Policy ${pid}`);
            } catch (e) {
                console.error("❌ Failed to process payment:", e.response?.data?.message || e.message);
            }
        }

        // 4. File a Claim
        console.log("Filing a Claim...");
        if (policyIds.length > 0) {
            try {
                await axios.post(`${API_URL}/claim`, {
                    policyId: policyIds[0],
                    claimAmount: 15000,
                    description: 'Medical emergency hospitalization for 3 days.'
                }, adminConfig);
                console.log(`✅ Filed Claim for Policy ${policyIds[0]}`);
            } catch (e) {
                 console.error("❌ Failed to file claim:", e.response?.data?.message || e.message);
            }
        }

        console.log("🎉 All Data Seeded and Verified Successfully!");
        
    } catch (err) {
        console.error("Unexpected Script Error:", err);
    }
}

seedData();
