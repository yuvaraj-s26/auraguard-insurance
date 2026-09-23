import api from '../api';

/**
 * High-Accuracy Natural Language Insurance Knowledge & Context Engine
 */
export async function processChatbotQuery(userText, currentUser) {
  const query = userText.trim().toLowerCase();

  // Load live customer context safely
  let liveData = {
    policies: [],
    claims: [],
    policyTypes: [],
    dashboard: null,
    recommendations: [],
    profile: null
  };

  try {
    const [polRes, claimRes, typesRes] = await Promise.allSettled([
      api.get('/policy'),
      api.get('/claim'),
      api.get('/policy/types')
    ]);

    if (polRes.status === 'fulfilled') liveData.policies = polRes.value.data || [];
    if (claimRes.status === 'fulfilled') liveData.claims = claimRes.value.data || [];
    if (typesRes.status === 'fulfilled') liveData.policyTypes = typesRes.value.data || [];

    if (currentUser?.userId) {
      const [dashRes, recRes, profRes] = await Promise.allSettled([
        api.get('/reports/customer-dashboard'),
        api.get('/ai/recommendations'),
        api.get(`/customer/user/${currentUser.userId}`)
      ]);
      if (dashRes.status === 'fulfilled') liveData.dashboard = dashRes.value.data;
      if (recRes.status === 'fulfilled') liveData.recommendations = recRes.value.data?.recommendations || [];
      if (profRes.status === 'fulfilled') liveData.profile = profRes.value.data;
    }
  } catch (e) {
    console.error("Context fetch error in chatbot:", e);
  }

  // =========================================================================
  // 1. GREETINGS & CASUAL INTENTS
  // =========================================================================
  if (/^(hi|hello|hey|good morning|good afternoon|good evening|namaste|greetings)/i.test(query)) {
    const userName = currentUser?.name ? ` **${currentUser.name}**` : '';
    const activeCount = liveData.policies.filter(p => p.status === 'Active').length;
    return `Hello${userName}! 👋 I am **Aura**, your dedicated insurance intelligence assistant.

I have direct access to your live policy records and claims status. You currently have **${activeCount} active policy(ies)**.

Here are some things you can ask me:
• *"What are my active policies?"*
• *"Check my claim status"*
• *"How much premium do I owe?"*
• *"How to file a new medical or motor claim?"*
• *"What AI recommendations do I have?"*
• *"What documents are required for settlement?"*`;
  }

  if (/^(who are you|what can you do|help|capabilities|features)/i.test(query)) {
    return `🤖 **I am AuraGuard Virtual Assistant**, engineered to help you manage your insurance lifecycle seamlessly:

1. **Policy Management**: View validity, terms, sum assured, and coverage expiry dates.
2. **Claim Tracking & Filing**: Check approval stages, automated rules check results, and fast-track SLA estimations.
3. **Premium Billing**: Check due amounts, UPI / Card payment methods, and 1-click renewals.
4. **AI Recommendations**: Discover personalized coverage matching your profile age and nominee safeguards.
5. **Document & KYC Guidance**: Know exact required documentation for rapid claims settlement.`;
  }

  // =========================================================================
  // 2. DUE PREMIUM & BILLING INTENTS
  // =========================================================================
  if (/(due|owe|pending premium|bill|payment due|how much.*pay|unpaid)/i.test(query)) {
    const dueAmount = liveData.dashboard?.duePremium || 0;
    if (dueAmount > 0) {
      return `💳 **Pending Premium Notice**:
You have a total outstanding due of **₹${dueAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}**.

**How to pay:**
1. Navigate to **Payments** from the left sidebar.
2. Click **Pay Now** to open our Interactive Simulated Gateway.
3. Choose your preferred checkout method:
   • **UPI / QR Code** (Dynamic QR with instant verification)
   • **Credit / Debit Card** (Visa, MasterCard, RuPay)
   • **NetBanking** (HDFC, SBI, ICICI, Axis, Kotak, PNB)
4. Your digital payment receipt is generated instantly upon payment authorization!`;
    } else {
      return `✅ **All Caught Up!**
You currently have **₹0.00** in pending premium payments. All your active policies are in good standing!

Next scheduled renewal: **${liveData.dashboard?.nextRenewalDate ? new Date(liveData.dashboard.nextRenewalDate).toLocaleDateString() : 'No immediate renewals'}**.`;
    }
  }

  // =========================================================================
  // 3. PAYMENT METHODS & RENEWAL INTENTS
  // =========================================================================
  if (/(how to pay|payment method|upi|netbanking|credit card|debit card|payment gateway)/i.test(query)) {
    return `💳 **Supported Payment Channels**:

AuraGuard provides a high-security simulated checkout gateway:
1. **UPI / QR Code**: Scan the dynamic on-screen QR code using Google Pay, PhonePe, or Paytm, or enter your VPA ID (\`user@upi\`).
2. **Virtual Credit / Debit Card**: Supports 16-digit cards with real-time live preview.
3. **NetBanking**: Integrated with major banks including SBI, HDFC, ICICI, Axis, and Kotak.

To make a payment, visit the **Payments** tab on the left navigation bar.`;
  }

  if (/(renew|renewal|1-click renew|extend policy)/i.test(query)) {
    return `🔄 **Policy Renewal Workflow**:

1. Open the **Policies** tab on the left menu.
2. For any policy nearing expiration or expired, click the **Renew Policy** button.
3. You will be directed to the payment portal to complete the renewal invoice.
4. Once completed, your policy tenure is automatically extended for another annual term!`;
  }

  // =========================================================================
  // 4. SPECIFIC POLICY OR ALL POLICIES INTENTS
  // =========================================================================
  const isPolicySpecific = query.match(/(?:policy\s+id\s+|policy\s+#|policy\s+)(\d+)/i) || query.match(/pol-\d+/i);
  const isMyPolicyQuery = /(my polic|my plan|active polic|registered polic|list my polic|show my polic|policy details)/i.test(query);

  if (isPolicySpecific || isMyPolicyQuery || /(when.*expire|validity|days remaining)/i.test(query)) {
    if (liveData.policies.length === 0) {
      return `📋 **No Registered Policies Found**:
You do not have any active or registered policies linked to your account yet.

💡 **Next Steps**:
• Browse our available plans in the **Policies** section.
• Or use the **Quote Calculator** on the home page to customize sum insured and riders!`;
    }

    let targets = liveData.policies;
    if (isPolicySpecific) {
      const idMatch = query.match(/(?:policy\s+id\s+|policy\s+#|policy\s+)(\d+)/i);
      const numMatch = query.match(/pol-\d+/i);
      if (idMatch) {
        const id = parseInt(idMatch[1]);
        targets = liveData.policies.filter(p => p.policyId === id);
      } else if (numMatch) {
        targets = liveData.policies.filter(p => p.policyNumber.toUpperCase() === numMatch[0].toUpperCase());
      }
    } else {
      // Keyword matching (health, life, motor, property)
      const keywords = ['health', 'life', 'motor', 'vehicle', 'property', 'term'];
      for (const kw of keywords) {
        if (query.includes(kw)) {
          const matched = liveData.policies.filter(p => p.policyName?.toLowerCase().includes(kw) || p.policyNumber?.toLowerCase().includes(kw));
          if (matched.length > 0) {
            targets = matched;
            break;
          }
        }
      }
    }

    if (targets.length === 0) {
      return `I couldn't find a policy matching that specific identifier. Here are your existing policies:\n\n` +
        liveData.policies.map(p => `• **${p.policyName}** (\`${p.policyNumber}\`) — Status: **${p.status}**`).join('\n') +
        `\n\nYou can ask: *"Tell me about ${liveData.policies[0]?.policyNumber}"*`;
    }

    return `📋 **Policy Overview (${targets.length} found)**:\n\n` +
      targets.map(p => {
        const start = new Date(p.startDate);
        const end = new Date(p.endDate);
        const now = new Date();
        const daysLeft = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
        const percentElapsed = Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)));
        const linkedClaims = liveData.claims.filter(c => c.policyId === p.policyId || c.policyNumber === p.policyNumber);

        return `🔹 **${p.policyName}** (\`${p.policyNumber}\`)
• **Status**: ${p.status === 'Active' ? '🟢 Active' : '🟡 ' + p.status}
• **Sum Assured Limit**: ₹${(p.sumAssured || p.coverageAmount || 0).toLocaleString()}
• **Annual Premium**: ₹${(p.premium || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
• **Validity**: ${start.toLocaleDateString()} to ${end.toLocaleDateString()} (**${daysLeft} days left**, ${percentElapsed}% elapsed)
• **Claims Associated**: ${linkedClaims.length > 0 ? `${linkedClaims.length} filed (${linkedClaims.map(c => `#${c.claimId} [${c.status}]`).join(', ')})` : 'None (0 filed)'}`;
      }).join('\n\n────────────────────\n\n');
  }

  // =========================================================================
  // 5. CLAIMS STATUS & FILING INTENTS
  // =========================================================================
  if (/(claim status|my claim|filed claim|track claim|pending claim|show claim)/i.test(query)) {
    if (liveData.claims.length === 0) {
      return `📑 **No Claims on Record**:
You haven't submitted any insurance claims yet.

If you experienced a medical emergency, accident, or property loss, click **File a New Claim** in the **Claims Office** tab. Our AI engine validates eligibility in under 2 minutes!`;
    }

    // Check if user asked about a specific claim ID (e.g. claim #2, claim 2)
    const claimMatch = query.match(/(?:claim\s+#|claim\s+id\s+|claim\s+)(\d+)/i);
    let matchedClaims = liveData.claims;
    if (claimMatch) {
      const cId = parseInt(claimMatch[1]);
      matchedClaims = liveData.claims.filter(c => c.claimId === cId);
    }

    if (matchedClaims.length === 0) {
      return `I couldn't find a claim matching ID #${claimMatch ? claimMatch[1] : ''}. Your active claims are: ` +
        liveData.claims.map(c => `Claim #${c.claimId} (${c.status})`).join(', ');
    }

    return `📑 **Your Claims Status (${matchedClaims.length} records)**:\n\n` +
      matchedClaims.map(c => {
        const riskTier = c.fraudRiskLevel || (c.fraudRiskScore >= 75 ? 'Critical' : c.fraudRiskScore >= 50 ? 'High' : c.fraudRiskScore >= 30 ? 'Moderate' : 'Low');
        return `🔸 **Claim #${c.claimId}** — Policy: \`${c.policyNumber}\`
• **Status**: **${c.status}**
• **Claim Amount**: ₹${(c.claimAmount || 0).toLocaleString()}
• **Filed Date**: ${new Date(c.claimDate).toLocaleDateString()}
• **Incident Type/Cause**: ${c.description || 'N/A'}
• **Rules Engine**: **${c.rulesCheckResult || 'Auto Passed'}**
• **AI Risk Assessment**: ${c.fraudRiskScore || 15}/100 (${riskTier} Risk)
• **Resolution Notes**: ${c.rulesCheckReason || 'Claim in regular review queue.'}`;
      }).join('\n\n────────────────────\n\n');
  }

  if (/(how to.*file.*claim|file a claim|submit claim|claim process|accident claim|medical claim)/i.test(query)) {
    return `⚡ **How to File a Claim (3-Step Animated Wizard)**:

1. Click on **Claims Office** in the left sidebar.
2. Click **File Accident/Medical Claim** to launch the Wizard:
   • **Step 1 (Incident Info)**: Choose your active policy, select category chip (*Medical, Collision, Theft, Property*), and enter incident date & loss amount.
   • **Step 2 (Evidence & Docs)**: Enter a short narrative and drag-and-drop your medical bills, invoices, or police report.
   • **Step 3 (Live AI Pre-Check)**: The system conducts a real-time pre-submission verification audit (Status, Limits, Fast-Track SLA eligibility).
3. Click **Confirm & Submit**. Most claims are processed within 24–48 business hours!`;
  }

  // =========================================================================
  // 6. FRAUD SCORE & AI DIAGNOSTICS INTENTS
  // =========================================================================
  if (/(fraud score|fraud risk|risk meter|how is fraud.*calculated|ai score)/i.test(query)) {
    return `🛡️ **AI Fraud Risk Scoring Engine**:

Every submitted claim is analyzed by our automated ML scoring algorithm on a scale of **0 to 100**:
• **Low Risk (0–29)**: Standard green channel, eligible for Fast-Track settlement.
• **Moderate Risk (30–49)**: Standard officer audit required.
• **High Risk (50–74)**: Additional document verification needed.
• **Critical Risk (75–100)**: Flagged for mandatory compliance review.

**Key Factors Evaluated**:
1. **Inception Proximity**: Claims filed within 30 days of purchasing the policy.
2. **Coverage Drain Ratio**: Claims demanding $>85\%$ of the total sum insured.
3. **Claim Velocity**: Frequency of claims submitted within a 180-day period.
4. **Keyword Anomaly Detection**: Text heuristic analysis for suspicious phrasing.`;
  }

  // =========================================================================
  // 7. AI POLICY RECOMMENDATIONS INTENTS
  // =========================================================================
  if (/(recommend|suggestion|best plan|ai match|what policy should i buy|custom plan)/i.test(query)) {
    if (liveData.recommendations.length > 0) {
      return `✨ **Personalized AI Policy Recommendations**:

Based on your customer profile age, nominee beneficiaries, and current coverage gaps:

` + liveData.recommendations.map(r => `🔹 **${r.policyName}** (${r.matchScore}% Match Score)
  • *Why Recommended*: ${r.rationale}
  • *Est. Premium*: ₹${r.estimatedMonthlyPremium?.toLocaleString()}/month
  • *Status*: ${r.isOwned ? '✅ Already Owned' : '👉 Available to Purchase'}`).join('\n\n') +
  `\n\nTo enroll in any recommendation, visit the **Policies** catalog on your dashboard!`;
    }

    return `✨ **AI Recommendation Engine**:
Our AI matches your profile based on:
• **Age Group**: Recommends Critical Illness or Term Life based on mortality and health risk tables.
• **Nominee Safeguards**: Recommends higher term coverage if family dependents are registered.
• **Gap Analysis**: Identifies if you lack Motor, Health, or Residential Property protection.

Visit your **Dashboard** to see live Match % cards!`;
  }

  // =========================================================================
  // 8. AVAILABLE INSURANCE PLANS & RIDERS
  // =========================================================================
  if (/(plans|policy types|all policies|catalog|what insurance.*offer)/i.test(query)) {
    const plans = liveData.policyTypes.length > 0 ? liveData.policyTypes : [
      { policyName: 'Life Secure Term Plan', description: 'Comprehensive term cover with high sum assured.', coverage: 1000000, premiumRate: 0.005 },
      { policyName: 'Health Guard Premium', description: 'Zero copay medical hospitalization shield.', coverage: 500000, premiumRate: 0.02 },
      { policyName: 'Motor Vehicle Policy', description: 'Comprehensive accident, third-party, and theft cover.', coverage: 300000, premiumRate: 0.015 },
      { policyName: 'Property Protection Plan', description: 'Structural and asset protection for residences.', coverage: 2500000, premiumRate: 0.003 }
    ];

    return `🏢 **AuraGuard Insurance Product Suite**:\n\n` +
      plans.map(p => `🛡️ **${p.policyName}**
• **Coverage Limit**: Up to ₹${(p.coverage || 0).toLocaleString()}
• **Premium Rate**: ${(p.premiumRate * 100).toFixed(2)}% base rate
• **Details**: ${p.description}`).join('\n\n') +
      `\n\n💡 Use the **Quote Calculator** on the home page to customize deductibles and riders!`;
  }

  if (/(rider|add-on|zero dep|critical illness|roadside|travel protect)/i.test(query)) {
    return `🛡️ **Available Add-on Protection Riders**:

1. **Zero Depreciation (+₹450/mo)**: Complete part replacement cover with 0% depreciation deductions during vehicle collision claims.
2. **Critical Illness Shield (+₹750/mo)**: Lump-sum payout upon diagnosis of 36 specified major critical illnesses.
3. **24/7 Roadside Assist (+₹250/mo)**: Emergency on-spot towing, flat tire replacement, jump-start, and fuel assistance.
4. **Global Travel Protect (+₹350/mo)**: Worldwide emergency medical indemnity, passport loss assistance, and flight delay protection.`;
  }

  // =========================================================================
  // 9. DOCUMENTS & KYC REQUIREMENTS
  // =========================================================================
  if (/(document|kyc|aadhaar|pan|upload|passport|bills|invoices|vault)/i.test(query)) {
    return `📑 **Document & Compliance Guide**:

**1. Mandatory KYC Onboarding**:
• Government Photo ID (Aadhaar / SSN / Passport).
• Residential Address Proof.

**2. Claims Supporting Documents**:
• **Medical Claims**: Discharge summary, hospital bill invoices, doctor prescription.
• **Motor Claims**: FIR / Police complaint, driving license, damage photos, repair estimate.
• **Property Claims**: Fire / disaster incident report, property tax receipt, damage assessment.

**Document Vault**:
Access your encrypted compliance vault via the **Document Vault** tab on the left menu to view, download, or upload documents anytime!`;
  }

  // =========================================================================
  // 10. PROFILE, AGENT & ACCOUNT DETAILS
  // =========================================================================
  if (/(my profile|my agent|assigned agent|nominee|phone number|address|kyc status)/i.test(query)) {
    if (liveData.profile) {
      const p = liveData.profile;
      return `👤 **Your Verified Profile Details**:
• **Customer ID**: #${p.customerId}
• **Name**: ${p.user?.name || currentUser?.name}
• **Email**: ${p.user?.email || currentUser?.email}
• **Phone**: ${p.phone || 'Not set'}
• **Address**: ${p.address || 'Not set'}
• **Nominee**: **${p.nomineeName || 'N/A'}** (${p.nomineeRelationship || 'Relation not specified'})
• **Assigned Agent**: ${p.agent?.name ? `${p.agent.name} (${p.agent.email})` : 'AuraGuard Central Support Desk'}

You can update your personal details in the **Profile** section.`;
    }

    return `👤 **Profile Management**:
You can review your contact details, Aadhaar KYC registration, and Nominee designations by clicking on your name in the top left of the sidebar menu.`;
  }

  // =========================================================================
  // 11. GENERAL INSURANCE TERMS & FAQs
  // =========================================================================
  if (/(what is sum assured|sum insured)/i.test(query)) {
    return `💡 **Sum Assured** is the guaranteed maximum financial protection amount that AuraGuard will pay out to you or your nominee in the event of an approved claim or covered incident.`;
  }

  if (/(what is deductible|copay)/i.test(query)) {
    return `💡 **Deductible / Copay**:
A deductible is the predetermined small amount you agree to pay out-of-pocket before insurance coverage kicks in. Choosing a higher deductible lowers your monthly premium rate!`;
  }

  if (/(cancel.*policy|refund|free look|cancellation)/i.test(query)) {
    return `🛡️ **30-Day Free-Look Period & Cancellation Policy**:
• You have **30 days** from the policy issuance date to review terms.
• If unsatisfied, you can cancel within this window for a **100% full refund** (minus standard stamp duty fees).
• To request a cancellation, contact our central compliance desk or your assigned agent.`;
  }

  if (/(contact|support|phone number|help desk|email|agent)/i.test(query)) {
    return `📞 **AuraGuard Support & Helpdesk**:
• **Toll-Free Helpline**: 1800-AURA-GUARD (1800-287-248)
• **Emergency Claims Line**: 24/7 Priority Desk (claims@insurance.com)
• **Compliance & KYC Desk**: support@insurance.com
• **Live Chat**: I am online 24/7 right here to answer any queries!`;
  }

  // =========================================================================
  // 12. INTELLIGENT FALLBACK WITH SMART TOPIC GUIDANCE
  // =========================================================================
  return `I understand you're asking about **"${userText}"**. 

Here are the most relevant actions and information I can provide:

1. 📋 **Policies**: Ask *"Show my active policies"* or *"When does my policy expire?"*
2. 📑 **Claims**: Ask *"What is the status of my claim?"* or *"How do I file a new claim?"*
3. 💳 **Billing**: Ask *"What is my due premium?"* or *"How to pay with UPI?"*
4. ✨ **AI Advice**: Ask *"What policies are recommended for me?"*
5. 🛡️ **Riders**: Ask *"Explain Zero Depreciation or Critical Illness rider"*

Feel free to click any suggestion or type your specific question!`;
}
