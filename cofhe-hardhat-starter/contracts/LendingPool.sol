// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "./CreditScoreRegistry.sol";
import "./CreditTierNFT.sol";

/**
 * @title LendingPool
 * @notice Under-collateralised lending pool powered by FHE credit scores
 */
contract LendingPool {
    CreditScoreRegistry public immutable registry;
    CreditTierNFT       public immutable nft;

    uint256 public constant STANDARD_RATIO       = 150;      // % collateral, no credit
    uint256 public constant CREDIT_RATIO         = 110;      // % collateral, credit-approved
    uint32  public constant MIN_CREDIT_THRESHOLD = 7_000;    // out of 10 000
    uint32  public constant BASE_RATE_BPS        = 1_500;    // 15.00 % APR (standard)
    uint256 public constant LOAN_DURATION        = 30 days;  // max term before liquidation
    uint256 public constant BASE_LIMIT_BPS       = 5_000;    // 50 % of liquidity — base credit limit
    uint256 public constant LIQUIDATOR_BOUNTY    = 5;        // 5 % of collateral paid to liquidator

    struct Loan {
        uint256 principal;
        uint256 collateral;
        bool    creditApproved;
        bool    active;
        uint256 issuedAt;
        uint32  interestRateBps;
        uint256 dueDate;
    }

    mapping(address => Loan)    public loans;
    mapping(address => uint256) public providerDeposits;
    mapping(address => uint256) public repaymentCount;
    mapping(address => uint256) public defaultCount;

    uint256 public totalDeposited;
    uint256 public totalBorrowed;

    // ─── Events ───────────────────────────────────────────────────────────────

    event Deposited(address indexed provider, uint256 amount);
    event Withdrawn(address indexed provider, uint256 amount);
    event LoanIssued(
        address indexed borrower,
        uint256 principal,
        bool    creditApproved,
        uint256 collateral,
        uint32  interestRateBps,
        uint256 dueDate
    );
    event LoanRepaid(
        address indexed borrower,
        uint256 principal,
        uint256 interest,
        uint256 newRepaymentCount
    );
    event LoanLiquidated(
        address indexed borrower,
        address indexed liquidator,
        uint256 collateral,
        uint256 deficit
    );

    constructor(address _registry, address _nft) {
        registry = CreditScoreRegistry(_registry);
        nft      = CreditTierNFT(_nft);
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

    function requestLoan(uint256 principal, bool useCredit) external payable {
        require(principal > 0,             "LendingPool: zero principal");
        require(!loans[msg.sender].active, "LendingPool: active loan exists");
        require(availableLiquidity() >= principal, "LendingPool: insufficient liquidity");
        require(principal <= maxBorrowable(msg.sender), "LendingPool: exceeds credit limit");

        uint256 ratio;
        uint32  rateBps;

        if (useCredit) {
            bool approved = registry.getRevealedApproval(msg.sender, address(this));
            require(approved, "LendingPool: credit score below threshold");

            uint32 usedThreshold = registry.getApprovalThreshold(msg.sender, address(this));
            require(
                usedThreshold >= MIN_CREDIT_THRESHOLD,
                "LendingPool: approval threshold too low"
            );

            require(registry.isRateRevealed(msg.sender), "LendingPool: personal rate not revealed");
            rateBps = registry.getRevealedRate(msg.sender);
            ratio   = CREDIT_RATIO;
        } else {
            rateBps = BASE_RATE_BPS;
            ratio   = STANDARD_RATIO;
        }

        uint256 required = (principal * ratio) / 100;
        require(msg.value >= required, "LendingPool: insufficient collateral");

        uint256 due = block.timestamp + LOAN_DURATION;
        loans[msg.sender] = Loan({
            principal:       principal,
            collateral:      msg.value,
            creditApproved:  useCredit,
            active:          true,
            issuedAt:        block.timestamp,
            interestRateBps: rateBps,
            dueDate:         due
        });

        totalBorrowed += principal;
        payable(msg.sender).transfer(principal);

        emit LoanIssued(msg.sender, principal, useCredit, msg.value, rateBps, due);
    }

    function repayLoan() external payable {
        Loan storage loan = loans[msg.sender];
        require(loan.active, "LendingPool: no active loan");

        uint256 interest = getAccruedInterest(msg.sender);
        uint256 totalDue = loan.principal + interest;
        require(msg.value >= totalDue, "LendingPool: send principal + accrued interest");

        uint256 principal  = loan.principal;
        uint256 collateral = loan.collateral;
        totalBorrowed -= principal;

        repaymentCount[msg.sender]++;
        delete loans[msg.sender];

        if (msg.value > totalDue) {
            payable(msg.sender).transfer(msg.value - totalDue);
        }
        payable(msg.sender).transfer(collateral);

        emit LoanRepaid(msg.sender, principal, interest, repaymentCount[msg.sender]);
    }

    /**
     * @notice Liquidate an overdue loan. Callable by anyone once dueDate has passed.
     *         Liquidator receives 5 % of collateral as a bounty; remainder stays in pool.
     *         The borrower's defaultCount is incremented, harming future credit signals.
     */
    function liquidate(address borrower) external {
        Loan storage loan = loans[borrower];
        require(loan.active,                    "LendingPool: no active loan");
        require(block.timestamp > loan.dueDate, "LendingPool: loan not yet due");

        uint256 collateral = loan.collateral;
        uint256 principal  = loan.principal;
        uint256 interest   = getAccruedInterest(borrower);
        uint256 totalDue   = principal + interest;

        defaultCount[borrower]++;
        totalBorrowed -= principal;
        delete loans[borrower];

        uint256 bounty  = (collateral * LIQUIDATOR_BOUNTY) / 100;
        uint256 deficit = totalDue > collateral ? totalDue - collateral : 0;

        payable(msg.sender).transfer(bounty);

        emit LoanLiquidated(borrower, msg.sender, collateral, deficit);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Views
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Maximum principal a borrower may request.
     *         Scaled by CreditTierNFT tier: Gold 2x, Silver 1.5x, Bronze 1.25x, None 1x.
     *         Base = BASE_LIMIT_BPS / 10 000 × availableLiquidity.
     */
    function maxBorrowable(address borrower) public view returns (uint256) {
        uint256 base = (availableLiquidity() * BASE_LIMIT_BPS) / 10_000;
        if (address(nft) == address(0)) return base;
        CreditTierNFT.Tier tier = nft.getTier(borrower);
        if (tier == CreditTierNFT.Tier.Gold)   return (base * 200) / 100;
        if (tier == CreditTierNFT.Tier.Silver) return (base * 150) / 100;
        if (tier == CreditTierNFT.Tier.Bronze) return (base * 125) / 100;
        return base;
    }

    function getAccruedInterest(address borrower) public view returns (uint256) {
        Loan storage loan = loans[borrower];
        if (!loan.active) return 0;
        uint256 elapsed = block.timestamp - loan.issuedAt;
        return (loan.principal * loan.interestRateBps * elapsed) / (10_000 * 365 days);
    }

    function totalRepaymentDue(address borrower) external view returns (uint256) {
        Loan storage loan = loans[borrower];
        if (!loan.active) return 0;
        return loan.principal + getAccruedInterest(borrower);
    }

    function availableLiquidity() public view returns (uint256) {
        uint256 bal = address(this).balance;
        return bal > totalBorrowed ? bal - totalBorrowed : 0;
    }

    function poolBalance() external view returns (uint256) {
        return address(this).balance;
    }

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
