const axios = require('axios');

async function test() {
    try {
        console.log("Logging in as Admin...");
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@auraguard.com',
            password: 'AdminPassword123!'
        });
        const token = loginRes.data.token;
        console.log("Logged in.");

        const config = { headers: { Authorization: `Bearer ${token}` } };
        
        // Fetch policies
        const polRes = await axios.get('http://localhost:5000/api/policy', config);
        const policy = polRes.data.find(p => p.policyNumber === 'POL-491709');
        
        if (!policy) {
            console.log("Policy POL-491709 not found.");
            // Print available policies to debug
            console.log("Available policies:", polRes.data.map(p => p.policyNumber));
            return;
        }

        console.log("Found policy ID:", policy.policyId);

        try {
            console.log("Attempting renewal...");
            const renewRes = await axios.post(`http://localhost:5000/api/policy/${policy.policyId}/renew`, {}, config);
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
