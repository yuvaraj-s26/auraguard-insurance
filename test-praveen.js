const axios = require('axios');

async function test() {
    try {
        let token;
        try {
            const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
                email: 'praveen@gmail.com',
                password: 'Welcome123!'
            });
            token = loginRes.data.token;
        } catch (e) {
            console.log("Login with Welcome123! failed. Trying Password123!...");
            const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
                email: 'praveen@gmail.com',
                password: 'Password123!'
            });
            token = loginRes.data.token;
        }

        console.log("Logged in as Praveen.");
        
        // Find Praveen's policies
        const polRes = await axios.get('http://localhost:5000/api/policy', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const policy = polRes.data.find(p => p.policyNumber === 'POL-491709');
        if (!policy) {
            console.log("Policy not found!");
            return;
        }

        console.log("Found policy ID:", policy.policyId);

        try {
            const renewRes = await axios.post(`http://localhost:5000/api/policy/${policy.policyId}/renew`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
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
