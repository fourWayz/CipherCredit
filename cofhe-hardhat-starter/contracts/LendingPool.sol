// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "./CreditScoreRegistry.sol";

/**
 * @title LendingPool
 * @notice Under-collateralised lending pool powered by FHE credit scores.
 *
 * Standard borrowers pay 150 % collateral.
 * Credit-approved borrowers pay only 110 % — a 40-point saving unlocked by
 * a privacy-preserving score the pool never sees in plaintext.
 *
 * Full credit-check flow (3-step on-chain reveal):
 *   1. Borrower: registry.grantLenderApproval(pool, threshold)
 *   2. Borrower: registry.allowApprovalPublic(pool)
 *   3. Keeper / CoFHE SDK: registry.publishApprovalResult(borrower, pool, value, sig)
 *   4. Borrower: pool.requestLoan(amount, true)  — pool reads revealed result
 */
contract LendingPool {
    CreditScoreRegistry public immutable registry;

    uint256 public constant STANDARD_RATIO    = 150;  // % collateral, no credit
    uint256 public constant CREDIT_RATIO      = 110;  // % collateral, credit-approved
    uint32  public constant MIN_CREDIT_THRESHOLD = 7_000; // out of 10 000

    struct Loan {
        uint256 principal;
        uint256 collateral;
        bool    creditApproved;
        bool    active;
        uint256 issuedAt;
    }

    mapping(address => Loan)    public loans;
    mapping(address => uint256) public providerDeposits;

    uint256 public totalDeposited;
    uint256 public totalBorrowed;

    // ─── Events ───────────────────────────────────────────────────────────────

    event Deposited(address indexed provider, uint256 amount);
    event Withdrawn(address indexed provider, uint256 amount);
    event LoanIssued(address indexed borrower, uint256 principal, bool creditApproved, uint256 collateral);
    event LoanRepaid(address indexed borrower, uint256 principal);

    constructor(address _registry) {
        registry = CreditScoreRegistry(_registry);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Liquidity providers
    // ─────────────────────────────────────────────────────────────────────────

    function deposit() external payable {
        require(msg.value > 0, "LendingPool: zero deposit");
        providerDeposits[msg.sender] += msg.value;
        totalDeposited               += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external {
        require(providerDeposits[msg.sender] >= amount, "LendingPool: insufficient deposit");
        require(availableLiquidity() >= amount,         "LendingPool: insufficient liquidity");
        providerDeposits[msg.sender] -= amount;
        totalDeposited               -= amount;
        payable(msg.sender).transfer(amount);
        emit Withdrawn(msg.sender, amount);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Borrowers
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Request a loan. Supply at least `collateralRequired()` ETH.
     *
     * When `useCredit = true` the pool reads the on-chain-revealed approval from
     * the registry (must complete the 3-step reveal flow first).
     *
     * @param principal  Amount to borrow in wei
     * @param useCredit  Whether to use the FHE credit approval
     */
    function requestLoan(uint256 principal, bool useCredit) external payable {
        require(principal > 0,             "LendingPool: zero principal");
        require(!loans[msg.sender].active, "LendingPool: active loan exists");
        require(availableLiquidity() >= principal, "LendingPool: insufficient liquidity");

        uint256 ratio;

        if (useCredit) {
            // Verify the on-chain revealed approval (from 3-step FHE decrypt flow)
            bool approved = registry.getRevealedApproval(msg.sender, address(this));
            require(approved, "LendingPool: credit score below threshold");

            // Ensure the borrower used a threshold meeting the pool minimum
            uint32 usedThreshold = registry.getApprovalThreshold(msg.sender, address(this));
            require(
                usedThreshold >= MIN_CREDIT_THRESHOLD,
                "LendingPool: approval threshold too low"
            );

            ratio = CREDIT_RATIO;
        } else {
            ratio = STANDARD_RATIO;
        }

        uint256 required = (principal * ratio) / 100;
        require(msg.value >= required, "LendingPool: insufficient collateral");

        loans[msg.sender] = Loan({
            principal:     principal,
            collateral:    msg.value,
            creditApproved: useCredit,
            active:        true,
            issuedAt:      block.timestamp
        });

        totalBorrowed += principal;
        payable(msg.sender).transfer(principal);

        emit LoanIssued(msg.sender, principal, useCredit, msg.value);
    }

    /**
     * @notice Repay the active loan in full and reclaim collateral.
     */
    function repayLoan() external payable {
        Loan storage loan = loans[msg.sender];
        require(loan.active,               "LendingPool: no active loan");
        require(msg.value >= loan.principal, "LendingPool: repayment too low");

        uint256 collateral = loan.collateral;
        totalBorrowed     -= loan.principal;
        delete loans[msg.sender];

        payable(msg.sender).transfer(collateral);
        emit LoanRepaid(msg.sender, msg.value);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Views
    // ─────────────────────────────────────────────────────────────────────────

    function availableLiquidity() public view returns (uint256) {
        uint256 bal = address(this).balance;
        return bal > totalBorrowed ? bal - totalBorrowed : 0;
    }

    function poolBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice Preview how much collateral a borrower needs.
     * @param principal  Intended borrow amount in wei
     * @param useCredit  Whether the borrower intends to use credit approval
     */
    function collateralRequired(uint256 principal, bool useCredit)
        external
        pure
        returns (uint256)
    {
        uint256 ratio = useCredit ? CREDIT_RATIO : STANDARD_RATIO;
        return (principal * ratio) / 100;
    }

    receive() external payable {}
}
