// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

/**
 * @title ICreditTierNFT
 * @notice Minimal interface for the CipherCredit tier NFT.
 * Tier values:
 *   0 = None   (no credit history or score below threshold)
 *   1 = Bronze (FHE score >= 7 000 — any credit-approved borrower)
 *   2 = Silver (FHE score >= ~7 500, rate <= 13.83 %)
 *   3 = Gold   (FHE score >= ~9 000, rate <= 10.33 %)
 */
interface ICreditTierNFT {

    enum Tier { None, Bronze, Silver, Gold }

    /** @notice Returns the credit tier of `holder`. */
    function getTier(address holder) external view returns (Tier);

    /** @notice Returns the tier as a human-readable string ("Gold", "Silver", etc). */
    function getTierName(address holder) external view returns (string memory);

    /** @notice Returns 1 if `holder` has minted a tier NFT, 0 otherwise (ERC-721 compatible). */
    function balanceOf(address holder) external view returns (uint256);

    /** @notice Returns true if `holder` has ever minted a tier NFT. */
    function hasMinted(address holder) external view returns (bool);
}
