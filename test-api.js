const axios = require('axios');

async function test() {
    try {
        const uniqueEmail = `test-${Date.now()}@test.com`;
        console.log("Registering:", uniqueEmail);
        
        // 1. Register a new customer
        await axios.post('http://localhost:5000/api/auth/register', {
            name: 'Praveen Tester',
            email: uniqueEmail,
            password: 'Password123!',
            role: 'Customer'
        });

        // 2. Login
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            email: uniqueEmail,
            password: 'Password123!'
        });
        const token = loginRes.data.token;
        const userId = loginRes.data.userId;
        console.log("Logged in. UserID:", userId);

        const config = { headers: { Authorization: `Bearer ${token}` } };

        // 3. Complete Profile
        try {
            await axios.post('http://localhost:5000/api/customer', {
                userId: userId,
                dob: '1990-01-01',
                gender: 'Male',
                phone: '1234567890',
                address: 'Test Addr',
                aadhaar: '123412341234',
                nomineeName: 'Nominee',
                nomineeRelationship: 'Spouse'
            }, config);
            console.log("Profile created.");
        } catch (e) {
            console.log("Profile create failed:", e.response?.data);
            return;
        }

        // Fetch customer ID
        const custRes = await axios.get(`http://localhost:5000/api/customer/user/${userId}`, config);
        const customerId = custRes.data.customerId;
        console.log("Customer ID:", customerId);

        // 4. Create Policy as Admin (Bypass 403)
        let policyId;
        try {
            // Wait, we need an admin token
            // For now, let's just see if Renew fails by itself with the Customer Token for an existing policy!
            console.log("Skipping policy purchase via script to test renew...");
        } catch(e) {}

        // Fetch Policies and Renew
        const polRes = await axios.get('http://localhost:5000/api/policy', config);
        if (polRes.data.length === 0) {
            console.log("No policies found to renew.");
            return;
        }
        policyId = polRes.data[0].policyId;
        console.log("Attempting to renew policy:", policyId);

        try {
            const renewRes = await axios.post(`http://localhost:5000/api/policy/${policyId}/renew`, {}, config);
            console.log("Renew SUCCESS:", renewRes.data);
        } catch (e) {
            console.log("Renew FAILED status:", e.response?.status);
            console.log("Renew FAILED data:", e.response?.data || e.message);
        }

    } catch (e) {
        console.error("Script failed:", e.response?.status, e.response?.data || e.message);
    }
}

test();
