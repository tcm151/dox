BEGIN TRANSACTION;

REMOVE INDEX claimant_recipient ON referralClaim;
DEFINE INDEX claimant ON referralClaim
    FIELDS claimant UNIQUE;

CREATE ONLY migration SET version = '2026.5.4';
COMMIT;
