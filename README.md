# Referral Network Program (RNP)

Referral Network Program (RNP) is a Solana-based on-chain referral system built using the Anchor framework. RNP enables projects to incentivize user referrals by rewarding actions performed via shared "blink" URLs. The program supports flexible reward strategies such as immediate one-time transfers or drip transfers over a specified duration and ensures that duplicate referrals are prevented through unique identifiers.

## Overview

RNP allows projects to:
- **Register and Configure:**  
  Upload their program’s IDL file, select rewardable method signatures, fund a controlled escrow account, and set reward strategies (immediate vs. drip transfers with optional volume and time-based boosts).
  
- **Generate Referral Links:**  
  Referrers generate specialized blink URLs that capture a unique referral code, the targeted rewardable action, and the amount they wish to distribute to their network.

- **Process Referrals:**  
  When a referred user clicks the blink URL and performs the transaction:
  - The program verifies that the targeted rewardable method is valid.
  - A unique referral record is created (using user address as unique identifier) to prevent duplicate rewards.
  - Tokens are transferred from the project’s escrow account to the referrer (and optionally to the referred user).
  - Rewards can be distributed as a one-time transfer or as a drip over time.

## General Architecture & Flow

1. **Project Initialization:**
   - **Input:**  
     - Upload program’s IDL.
     - Select rewardable method signatures.
     - Fund the rewards escrow account (controlled by a PDA).
     - Choose a reward strategy (immediate reward per referral or drip transfers).
     - Define reward amounts and optional volume/time boost incentives.
   
   - **Instruction:**  
     - `initialize_project`  
       This instruction creates the project configuration, stores the IDL hash, allowed method signatures, reward strategies, and sets up the escrow account using a Program Derived Address (PDA).

2. **Referral Generation:**
   - **Process:**  
     - Referrers generate a "blink URL" that contains:
       - A unique referral code (each wallet gets its own code).
       - The selected rewardable action.
       - The distribution amount for the referral.
   
3. **Referral Processing:**
   - **Process:**  
     - When a referred user uses the blink URL, the program builds and sends a Solana transaction using the project's IDL.
     - An event with the transaction ID is emitted for off-chain processing.
     - After confirming the transaction, the program:
       - Creates a unique referral record to prevent multiple rewards for the same user.
       - Transfers tokens from the escrow to the referrer and, optionally, to the referred user.
       - Handles reward distribution based on the selected strategy (immediate or drip).
