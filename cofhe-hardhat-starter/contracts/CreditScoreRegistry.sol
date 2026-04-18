// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@fhenixprotocol/cofhe-contracts/FHE.sol";

/**
 * @title CreditScoreRegistry
 * @notice Privacy-preserving on-chain credit scoring using Fully Homomorphic Encryption.
 *
 * Users submit four encrypted financial signals (each normalised 0-100).
 * The contract computes a weighted score entirely in FHE — the numeric value is
 * never revealed unless the user explicitly requests decryption.
 *
 * Lenders receive only an encrypted pass/fail ebool; they learn nothing about
 * the underlying financial data or the numeric score.
 *
 * Score formula  (max = 10 000):
 *   score = balance*25 + txFrequency*20 + repaymentHistory*40 + (100-debtRatio)*15
 */
contract CreditScoreRegistry {

    // ─── Encrypted data per borrower ─────────────────────────────────────────

    struct CreditData {
        euint32 encBalance;      // portfolio / wallet balance score  (0-100)
        euint32 encTxFreq;       // on-chain activity score           (0-100)
        euint32 encRepayment;    // repayment history score           (0-100)
        euint32 encDebtRatio;    // existing debt burden              (0-100, lower = better)
        bool    hasData;
        uint256 updatedAt;
    }

    // ─── Weights (must sum to 100) ────────────────────────────────────────────

    uint32 public constant W_BALANCE    = 25;
    uint32 public constant W_TX_FREQ    = 20;
    uint32 public constant W_REPAYMENT  = 40;
    uint32 public constant W_DEBT       = 15;  // applied to (100 - debtRatio)

    uint32 public constant MAX_SCORE    = 10_000;

    // ─── State ────────────────────────────────────────────────────────────────

    mapping(address => CreditData) private _data;
    mapping(address => euint32)    private _scores;
    mapping(address => bool)       private _scoreValid;

    // borrower => lender => encrypted approval result (euint32: 0=denied, 1=approved)
    mapping(address => mapping(address => euint32)) private _approvals;
    mapping(address => mapping(address => bool))    private _approvalSet;
    // minimum score the borrower used when granting the approval
    mapping(address => mapping(address => uint32))  private _approvalThresholds;

    // ─── Events ───────────────────────────────────────────────────────────────

    event CreditDataSubmitted(address indexed borrower, uint256 timestamp);
    event ScoreComputed(address indexed borrower);
    event LenderApprovalGranted(address indexed borrower, address indexed lender, uint32 threshold);

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier requiresData(address user) {
        require(_data[user].hasData, "CreditScoreRegistry: no credit data submitted");
        _;
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Borrower actions
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Submit encrypted financial signals. All values normalised to 0-100.
     * @param balance      Portfolio / wallet balance score   (higher = better)
     * @param txFreq       On-chain transaction activity      (higher = better)
     * @param repayment    Historical repayment reliability   (higher = better)
     * @param debtRatio    Current debt burden                (lower  = better)
     */
    function submitCreditData(
        InEuint32 calldata balance,
        InEuint32 calldata txFreq,
        InEuint32 calldata repayment,
        InEuint32 calldata debtRatio
    ) external {
        CreditData storage d = _data[msg.sender];

        d.encBalance   = FHE.asEuint32(balance);
        d.encTxFreq    = FHE.asEuint32(txFreq);
        d.encRepayment = FHE.asEuint32(repayment);
        d.encDebtRatio = FHE.asEuint32(debtRatio);
        d.hasData      = true;
        d.updatedAt    = block.timestamp;

        // Contract needs access to compute score later
        FHE.allowThis(d.encBalance);
        FHE.allowThis(d.encTxFreq);
        FHE.allowThis(d.encRepayment);
        FHE.allowThis(d.encDebtRatio);

        // Borrower can decrypt their own inputs
        FHE.allowSender(d.encBalance);
        FHE.allowSender(d.encTxFreq);
        FHE.allowSender(d.encRepayment);
        FHE.allowSender(d.encDebtRatio);

        _scoreValid[msg.sender] = false; // invalidate cached score
        emit CreditDataSubmitted(msg.sender, block.timestamp);
    }

    /**
     * @notice Compute and return caller's encrypted score.
     * Decrypt via CoFHE SDK using the caller's permit — numeric value stays private.
     */
    function getMyScore()
        external
        requiresData(msg.sender)
        returns (euint32)
    {
        euint32 score = _scoreValid[msg.sender]
            ? _scores[msg.sender]
            : _recomputeScore(msg.sender);

        FHE.allowSender(score);
        return score;
    }

    /**
     * @notice Grant a specific lender an encrypted pass/fail approval.
     *
     * Computes `approved = (score >= threshold)` in FHE.
     * The lender can decrypt only the boolean result — they never learn the score.
     *
     * @param lender    Address authorised to decrypt the approval
     * @param threshold Minimum score out of 10 000 (e.g. 7000 = 70 %)
     */
    function grantLenderApproval(address lender, uint32 threshold)
        external
        requiresData(msg.sender)
    {
        euint32 score = _scoreValid[msg.sender]
            ? _scores[msg.sender]
            : _recomputeScore(msg.sender);

        // FHE comparison: approved iff score >= threshold (result: 0 or 1)
        ebool  approvedBool = FHE.gte(score, FHE.asEuint32(threshold));
        // Store as euint32 so the 3-step on-chain reveal flow works uniformly
        euint32 approvedInt = FHE.asEuint32(approvedBool);

        FHE.allowThis(approvedInt);
        FHE.allow(approvedInt, lender);   // lender can decrypt
        FHE.allowSender(approvedInt);     // borrower can also verify their own status

        _approvals[msg.sender][lender]           = approvedInt;
        _approvalSet[msg.sender][lender]         = true;
        _approvalThresholds[msg.sender][lender]  = threshold;

        emit LenderApprovalGranted(msg.sender, lender, threshold);
    }

    /**
     * @notice Step 1 of on-chain reveal: allow the approval to be publicly decrypted.
     * Call this before initiating `decryptForTx` in the CoFHE SDK.
     */
    function allowApprovalPublic(address lender) external requiresData(msg.sender) {
        require(_approvalSet[msg.sender][lender], "CreditScoreRegistry: no approval set");
        FHE.allowPublic(_approvals[msg.sender][lender]);
    }

    /**
     * @notice Step 3 of on-chain reveal: submit the threshold-network decryption result.
     * @param borrower  The borrower whose approval is being revealed
     * @param lender    The lender the approval was issued to
     * @param plaintext 0 (denied) or 1 (approved)
     * @param signature Threshold-network signature over the plaintext
     */
    function publishApprovalResult(
        address borrower,
        address lender,
        uint32  plaintext,
        bytes calldata signature
    ) external {
        require(_approvalSet[borrower][lender], "CreditScoreRegistry: no approval set");
        FHE.publishDecryptResult(_approvals[borrower][lender], plaintext, signature);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Lender / lending pool actions
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Read the encrypted approval handle the borrower granted this lender.
     * Only callable by the authorised lender; decrypt via CoFHE SDK.
     */
    function getLenderApproval(address borrower)
        external
        view
        returns (euint32)
    {
        require(
            _approvalSet[borrower][msg.sender],
            "CreditScoreRegistry: no approval granted to caller"
        );
        return _approvals[borrower][msg.sender];
    }

    /**
     * @notice Read the on-chain-revealed approval result after the 3-step flow.
     * Returns true if approved, false if denied.
     */
    function getRevealedApproval(address borrower, address lender)
        external
        view
        returns (bool approved)
    {
        require(_approvalSet[borrower][lender], "CreditScoreRegistry: no approval set");
        (uint256 value, bool decrypted) = FHE.getDecryptResultSafe(_approvals[borrower][lender]);
        require(decrypted, "CreditScoreRegistry: approval not yet revealed on-chain");
        return value == 1;
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  View helpers
    // ─────────────────────────────────────────────────────────────────────────

    function hasData(address user) external view returns (bool) {
        return _data[user].hasData;
    }

    function dataUpdatedAt(address user) external view returns (uint256) {
        return _data[user].updatedAt;
    }

    function hasApprovalFor(address borrower, address lender) external view returns (bool) {
        return _approvalSet[borrower][lender];
    }

    function getApprovalThreshold(address borrower, address lender) external view returns (uint32) {
        return _approvalThresholds[borrower][lender];
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Internal
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @dev Weighted score computed entirely in FHE:
     *      score = encBalance*25 + encTxFreq*20 + encRepayment*40 + (100-encDebtRatio)*15
     *      Maximum = 10 000 (perfect credit across all four signals)
     */
    function _recomputeScore(address borrower) internal returns (euint32) {
        CreditData storage d = _data[borrower];

        euint32 balScore  = FHE.mul(d.encBalance,   FHE.asEuint32(W_BALANCE));
        euint32 txScore   = FHE.mul(d.encTxFreq,    FHE.asEuint32(W_TX_FREQ));
        euint32 repScore  = FHE.mul(d.encRepayment, FHE.asEuint32(W_REPAYMENT));

        // Low debt = high score: invert debtRatio before weighting
        euint32 invDebt   = FHE.sub(FHE.asEuint32(100), d.encDebtRatio);
        euint32 debtScore = FHE.mul(invDebt, FHE.asEuint32(W_DEBT));

        euint32 score = FHE.add(
            FHE.add(FHE.add(balScore, txScore), repScore),
            debtScore
        );

        FHE.allowThis(score);
        FHE.allowSender(score);

        _scores[borrower]     = score;
        _scoreValid[borrower] = true;

        emit ScoreComputed(borrower);
        return score;
    }
}
