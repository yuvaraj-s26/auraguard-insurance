INSERT INTO Claims (PolicyId, CustomerId, ClaimAmount, Description, ClaimDate, Status) VALUES
(2, 2, 12500.00, 'Reimbursement for knee surgery and hospitalization costs.', '2026-06-15 08:30:00', 'Approved'),
(4, 2, 4500.00, 'Minor bumper damage repair after parking lot collision.', '2026-07-02 14:15:00', 'Pending'),
(2, 2, 8000.00, 'Emergency room visit for severe allergic reaction.', '2026-07-12 20:45:00', 'Under Review');

INSERT INTO Documents (PolicyId, DocumentType, FileName, FilePath, UploadDate) VALUES
(2, 'Aadhaar', 'aadhaar_card_scanned.pdf', '/uploads/aadhaar_card_scanned.pdf', '2026-01-10 09:00:00'),
(2, 'Medical', 'health_clearance_dr_smith.pdf', '/uploads/health_clearance_dr_smith.pdf', '2026-01-12 11:30:00'),
(4, 'PolicyDoc', 'vehicle_registration_cert.jpg', '/uploads/vehicle_registration_cert.jpg', '2026-03-05 16:20:00');
