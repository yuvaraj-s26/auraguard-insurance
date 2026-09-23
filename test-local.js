const { spawn } = require('child_process');
const axios = require('axios');

const backend = spawn('dotnet', ['run', '--urls=http://localhost:5001'], {
    cwd: 'C:\\Users\\yuvar\\.gemini\\antigravity\\scratch\\insurance-system\\backend'
});

backend.stdout.on('data', (data) => console.log(`[Backend] ${data}`));
backend.stderr.on('data', (data) => console.error(`[Backend Error] ${data}`));

setTimeout(async () => {
    try {
        console.log("Logging in...");
        const loginRes = await axios.post('http://localhost:5001/api/auth/login', {
            email: 'admin@insurance.com',
            password: 'admin123'
        });
        const token = loginRes.data.token;
        console.log("Logged in.");

        const config = { headers: { Authorization: `Bearer ${token}` } };
        
        console.log("Attempting renewal on port 5001...");
        const renewRes = await axios.post(`http://localhost:5001/api/policy/2/renew`, {}, config);
        console.log("Renew SUCCESS:", renewRes.data);
    } catch (e) {
        console.log("Renew FAILED status:", e.response?.status);
        console.log("Renew FAILED data:", e.response?.data || e.message);
    }

    backend.kill();
}, 5000); // wait 5s for backend to start
