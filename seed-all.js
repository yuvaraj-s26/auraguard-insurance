const axios = require('axios');
const { execSync } = require('child_process');

const API_URL = 'http://localhost:5000/api';

async function seed() {
    try {
        console.log("Waiting for backend API to verify connectivity...");
        await new Promise(resolve => setTimeout(resolve, 2000));

        let adminToken;
        try {
            const loginRes = await axios.post(`${API_URL}/auth/login`, {
                email: 'yuvaraj@insurance.com',
                password: 'Yuva@123'
            });
            adminToken = loginRes.data.token;
            console.log("✅ Admin logged in.");
        } catch (e) {
            console.error("❌ Backend not ready. Check if API is running and Admin credentials exist.");
            return;
        }

        const adminConfig = { headers: { Authorization: `Bearer ${adminToken}` } };

        console.log("Cleaning database tables to prevent duplication...");
        try {
            const queries = [
                "DELETE FROM ClaimComments;",
                "DELETE FROM Documents;",
                "DELETE FROM Payments;",
                "DELETE FROM Claims;",
                "DELETE FROM Policies;",
                "DELETE FROM Customers;",
                "DELETE FROM AuditLogs;",
                "DELETE FROM Users WHERE Role != 'Admin';",
                "ALTER TABLE Customers AUTO_INCREMENT = 1;",
                "ALTER TABLE Policies AUTO_INCREMENT = 1;",
                "ALTER TABLE Claims AUTO_INCREMENT = 1;",
                "ALTER TABLE Payments AUTO_INCREMENT = 1;",
                "ALTER TABLE Documents AUTO_INCREMENT = 1;",
                "ALTER TABLE ClaimComments AUTO_INCREMENT = 1;",
                "ALTER TABLE AuditLogs AUTO_INCREMENT = 1;",
                "ALTER TABLE Users AUTO_INCREMENT = 2;"
            ];
            for (const sql of queries) {
                execSync(`mysql -u root -pRajaYuva@2610 -P 3306 -h 127.0.0.1 insurance_db -e "${sql}"`);
            }
            console.log("✅ Database tables cleared and auto-increments reset successfully.");
        } catch (e) {
            console.warn("⚠️ Database clear warning (continuing anyway):", e.message);
        }

        // ==========================================
        // 1. REGISTER AGENTS
        // ==========================================
        console.log("Registering agents...");
        const agentsToRegister = [
            { name: 'Praveen Agent', email: 'praveen@insurance.com', password: 'Praveen@123', role: 'Agent' },
            { name: 'Vignesh Agent', email: 'vignesh@insurance.com', password: 'Vignesh@123', role: 'Agent' }
        ];

        for (const ag of agentsToRegister) {
            await axios.post(`${API_URL}/auth/register`, ag);
            console.log(`✅ Registered agent request for ${ag.name}`);
        }

        // Auto-approve agents directly in DB so they can work
        try {
            execSync(`mysql -u root -pRajaYuva@2610 -P 3306 -h 127.0.0.1 insurance_db -e "UPDATE Users SET IsApproved = 1 WHERE Role = 'Agent';"`);
            console.log("✅ Approved all agents.");
        } catch (e) {
            console.error("❌ Failed to approve agents in DB:", e.message);
        }

        // ==========================================
        // 2. REGISTER CUSTOMERS
        // ==========================================
        const customersToRegister = [
            { name: 'Chandru', email: 'chandru@insurance.com', password: 'Chandru@123', role: 'Customer' },
            { name: 'Senthil', email: 'senthil@insurance.com', password: 'Senthil@123', role: 'Customer' },
            { name: 'Sabarish', email: 'sabarish@insurance.com', password: 'Sabarish@123', role: 'Customer' }
        ];

        console.log("Registering customers...");
        for (const cust of customersToRegister) {
            await axios.post(`${API_URL}/auth/register`, cust);
            console.log(`✅ Registered customer ${cust.name}`);
        }

        // Helper to login and get token/config
        async function getCustomerContext(email, password) {
            const loginRes = await axios.post(`${API_URL}/auth/login`, { email, password });
            return {
                userId: loginRes.data.userId,
                token: loginRes.data.token,
                config: { headers: { Authorization: `Bearer ${loginRes.data.token}` } }
            };
        }

        const chandruCtx = await getCustomerContext('chandru@insurance.com', 'Chandru@123');
        const senthilCtx = await getCustomerContext('senthil@insurance.com', 'Senthil@123');
        const sabarishCtx = await getCustomerContext('sabarish@insurance.com', 'Sabarish@123');

        // ==========================================
        // 3. CREATE KYC PROFILES
        // ==========================================
        console.log("Creating KYC Customer Profiles...");
        
        const cProf = await axios.post(`${API_URL}/customer`, {
            userId: chandruCtx.userId,
            dob: '1993-04-12',
            gender: 'Male',
            phone: '9876543210',
            address: '7a Palace Road, Chennai - 600001',
            aadhaar: '123456789012',
            nomineeName: 'Deepa Chandru',
            nomineeRelationship: 'Spouse'
        }, chandruCtx.config);
        const chandruCustomerId = cProf.data.customerId;

        const sProf = await axios.post(`${API_URL}/customer`, {
            userId: senthilCtx.userId,
            dob: '1990-08-20',
            gender: 'Male',
            phone: '9876543211',
            address: '12 Main Street, Coimbatore - 641002',
            aadhaar: '123456789013',
            nomineeName: 'Ravi Senthil',
            nomineeRelationship: 'Father'
        }, senthilCtx.config);
        const senthilCustomerId = sProf.data.customerId;

        const sabProf = await axios.post(`${API_URL}/customer`, {
            userId: sabarishCtx.userId,
            dob: '1995-11-05',
            gender: 'Male',
            phone: '9876543212',
            address: '45 Gandhi Road, Madurai - 625001',
            aadhaar: '123456789014',
            nomineeName: 'Anitha Sabarish',
            nomineeRelationship: 'Mother'
        }, sabarishCtx.config);
        const sabarishCustomerId = sabProf.data.customerId;
        
        console.log("✅ KYC Profiles seeded.");

        // ==========================================
        // 4. PURCHASE POLICIES
        // ==========================================
        console.log("Issuing Policies...");
        
        // Policy 1 (Chandru - Life plan)
        const pol1 = (await axios.post(`${API_URL}/policy`, {
            customerId: chandruCustomerId,
            policyTypeId: 1, // Life Secure Term Plan
            sumAssured: 1000000.00
        }, adminConfig)).data;

        // Policy 2 (Senthil - Health Guard)
        const pol2 = (await axios.post(`${API_URL}/policy`, {
            customerId: senthilCustomerId,
            policyTypeId: 2, // Health Guard Premium
            sumAssured: 500000.00
        }, adminConfig)).data;

        // Policy 3 (Sabarish - Motor Vehicle)
        const pol3 = (await axios.post(`${API_URL}/policy`, {
            customerId: sabarishCustomerId,
            policyTypeId: 3, // Motor Vehicle Policy
            sumAssured: 300000.00
        }, adminConfig)).data;

        console.log("✅ Policies Issued.");

        // ==========================================
        // 5. PAY PREMIUMS / TRANSACTIONS
        // ==========================================
        console.log("Processing Transactions / Payments...");
        
        // Pay Policy 1 (Chandru paid via UPI)
        await axios.post(`${API_URL}/payment`, {
            policyId: pol1.policyId,
            amount: pol1.premium,
            paymentMode: 'UPI'
        }, chandruCtx.config);

        // Pay Policy 2 (Senthil paid via Credit Card)
        await axios.post(`${API_URL}/payment`, {
            policyId: pol2.policyId,
            amount: pol2.premium,
            paymentMode: 'Credit Card'
        }, senthilCtx.config);

        // Pay Policy 3 (Sabarish paid via Net Banking)
        await axios.post(`${API_URL}/payment`, {
            policyId: pol3.policyId,
            amount: pol3.premium,
            paymentMode: 'Net Banking'
        }, sabarishCtx.config);

        console.log("✅ Premium Payments processed.");

        // ==========================================
        // 6. FILE CLAIMS
        // ==========================================
        console.log("Filing Claims and executing Rules Engine checks...");

        // Claim 1: Settled (Chandru)
        const cl1 = (await axios.post(`${API_URL}/claim`, {
            policyId: pol1.policyId,
            customerId: chandruCustomerId,
            incidentDate: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().split('T')[0], // 30 days ago
            claimAmount: 50000.00,
            description: 'Accident orthopedic care and medical diagnostics.'
        }, chandruCtx.config)).data;
        // Approve & Settle Claim 1
        await axios.put(`${API_URL}/claim/${cl1.claimId}/status`, { status: 'Approved' }, adminConfig);
        await axios.put(`${API_URL}/claim/${cl1.claimId}/status`, { status: 'Settled' }, adminConfig);

        // Claim 2: Pending (Chandru)
        const cl2 = (await axios.post(`${API_URL}/claim`, {
            policyId: pol1.policyId,
            customerId: chandruCustomerId,
            incidentDate: new Date().toISOString().split('T')[0],
            claimAmount: 5000.00,
            description: 'Routine wellness physical exam and dental clean.'
        }, chandruCtx.config)).data;

        // Claim 3: Approved (Senthil)
        const cl3 = (await axios.post(`${API_URL}/claim`, {
            policyId: pol2.policyId,
            customerId: senthilCustomerId,
            incidentDate: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString().split('T')[0], // 2 days ago
            claimAmount: 200000.00,
            description: 'Emergency cardiac checkup and ICU room charges.'
        }, senthilCtx.config)).data;
        await axios.put(`${API_URL}/claim/${cl3.claimId}/status`, { status: 'Approved' }, adminConfig);

        // Claim 4: Under Review (Sabarish)
        const cl4 = (await axios.post(`${API_URL}/claim`, {
            policyId: pol3.policyId,
            customerId: sabarishCustomerId,
            incidentDate: new Date().toISOString().split('T')[0],
            claimAmount: 12000.00,
            description: 'Minor traffic fender collision bumper replacement.'
        }, sabarishCtx.config)).data;
        await axios.put(`${API_URL}/claim/${cl4.claimId}/status`, { status: 'Under Review' }, adminConfig);

        console.log("✅ Claims filed.");

        // ==========================================
        // 7. UPLOAD COMPLIANCE DOCUMENTS
        // ==========================================
        console.log("Uploading Compliance & Claim Documents...");

        async function uploadDocument(policyId, claimId, type, name, status, reviewComment, config) {
            const formData = new FormData();
            formData.append('policyId', policyId);
            formData.append('documentType', type);
            if (claimId) {
                formData.append('claimId', claimId);
            }
            const file = new File(['Dummy compliance document verification buffer.'], name, { type: 'text/plain' });
            formData.append('file', file);

            const res = await axios.post(`${API_URL}/document`, formData, config);
            const docId = res.data.document.documentId;

            if (status !== 'Pending') {
                const updateDocSql = `UPDATE Documents SET Status = '${status}', ReviewComment = '${reviewComment || ''}' WHERE DocumentId = ${docId};`;
                execSync(`mysql -u root -pRajaYuva@2610 -P 3306 -h 127.0.0.1 insurance_db -e "${updateDocSql}"`);
            }
        }

        // Upload general KYC documents for Chandru (linked to policy 1)
        await uploadDocument(pol1.policyId, null, 'Aadhaar', 'chandru_aadhaar.txt', 'Verified', 'KYC identity verification match.', chandruCtx.config);
        
        // Upload claim supporting files
        await uploadDocument(pol1.policyId, cl1.claimId, 'Medical Report', 'hospital_bill_receipt.txt', 'Verified', 'Hospital receipts match settlement audit.', chandruCtx.config);
        await uploadDocument(pol2.policyId, cl3.claimId, 'Medical Report', 'cardiac_report.txt', 'Pending', '', senthilCtx.config);
        await uploadDocument(pol3.policyId, cl4.claimId, 'Accident Report', 'fender_photo.txt', 'Verified', 'Verification logs approved by agent.', sabarishCtx.config);

        console.log("✅ Verification Documents uploaded.");

        // ==========================================
        // 8. SEED CHAT CONVERSATIONS
        // ==========================================
        console.log("Seeding Support Messaging threads...");

        // Login as Praveen Agent
        const agentCtx = await getCustomerContext('praveen@insurance.com', 'Praveen@123');

        // Claim 1 Chat (Settled)
        await axios.post(`${API_URL}/claim/${cl1.claimId}/comments`, { message: "I have uploaded the diagnostic medical receipts and doctor invoice files." }, chandruCtx.config);
        await axios.post(`${API_URL}/claim/${cl1.claimId}/comments`, { message: "Thank you Chandru. We have verified the invoices. Settle payout initiated." }, agentCtx.config);
        await axios.post(`${API_URL}/claim/${cl1.claimId}/comments`, { message: "Disbursement completed. Receipt is available for download." }, adminConfig);

        // Claim 4 Chat (Under Review)
        await axios.post(`${API_URL}/claim/${cl4.claimId}/comments`, { message: "I filed a claim for bumper replacement. When will review begin?" }, sabarishCtx.config);
        await axios.post(`${API_URL}/claim/${cl4.claimId}/comments`, { message: "Hello Sabarish, we need you to upload your primary medical clearance report first." }, agentCtx.config);

        console.log("Seeding Audit Logs...");
        const auditLogQueries = [
            "INSERT INTO AuditLogs (UserId, AgentName, Action, Details, Timestamp) VALUES ((SELECT UserId FROM Users WHERE Email='praveen@insurance.com'), 'Praveen Agent', 'Update Claim Status', 'Agent updated Claim #1 status to Approved.', NOW() - INTERVAL 1 HOUR);",
            "INSERT INTO AuditLogs (UserId, AgentName, Action, Details, Timestamp) VALUES ((SELECT UserId FROM Users WHERE Email='praveen@insurance.com'), 'Praveen Agent', 'Verify Document', 'Agent verified Document #1 (Type: Aadhaar) for Customer Chandru.', NOW() - INTERVAL 45 MINUTE);",
            "INSERT INTO AuditLogs (UserId, AgentName, Action, Details, Timestamp) VALUES ((SELECT UserId FROM Users WHERE Email='vignesh@insurance.com'), 'Vignesh Agent', 'Collect Premium', 'Agent collected premium payment of ₹5,000 for Policy POL-483686.', NOW() - INTERVAL 30 MINUTE);"
        ];
        for (const sql of auditLogQueries) {
            execSync(`mysql -u root -pRajaYuva@2610 -P 3306 -h 127.0.0.1 insurance_db -e "${sql}"`);
        }
        console.log("✅ Audit Logs seeded.");

        console.log("\n🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!");
        console.log("==========================================");
        console.log("Test Login Accounts:");
        console.log("1. Admin:    yuvaraj@insurance.com / Yuva@123");
        console.log("2. Agent 1:  praveen@insurance.com / Praveen@123");
        console.log("3. Agent 2:  vignesh@insurance.com / Vignesh@123");
        console.log("4. Customer: chandru@insurance.com / Chandru@123");
        console.log("5. Customer: senthil@insurance.com / Senthil@123");
        console.log("6. Customer: sabarish@insurance.com / Sabarish@123");
        console.log("==========================================\n");

    } catch (err) {
        console.error("❌ Seed failed:", err.response?.data || err.message);
    }
}

seed();
