# Stealth Wallet - 0xShadow - EthereumNS Hackathon Project

A privacy focused Ethereum wallet supporting ERC5564 stealth addresses for confidential transactions. This project combines a React + TypeScript frontend with Solidity smart contracts to enable sending and receiving ETH through stealth addresses, offering enhanced privacy for blockchain users.

---

## App Demo
[▶️ App Demo on YouTube](https://www.youtube.com/watch?v=deBNxwTUcmE)

## Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Installation & Usage](#installation--usage)
  - [Frontend](#frontend)
  - [Smart Contracts](#smart-contracts)
- [Makefile Commands](#makefile-commands)
- [Features](#features)

---

## Project Overview

This wallet allows you to:
- Send ETH to stealth addresses.
- Send ETH from stealth addresses.
- View send transaction history.
- View balances for all addresses.

The project includes:
- A frontend app for wallet management and transaction tracking.
- Smart contracts for stealth address operations.
- Scripts and tooling for local Ethereum network deployment.

---

## Tech Stack

- Frontend: React, TypeScript, ethers.js, Material UI
- Smart Contracts: Solidity, Hardhat
- Tooling: Makefile for automating contract tasks

---

## Installation & Usage

### Frontend

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

The application will run on [http://localhost:5173](http://localhost:5173).

---

### Smart Contracts

1. Navigate to the contracts directory:

   ```bash
   cd contracts
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the local Ethereum node using Hardhat:

   ```bash
   make localnet
   ```

4. Deploy the smart contracts to the local network:

   ```bash
   make deploy
   ```

5. (Optional) Fund a test address with ETH:

   ```bash
   make fund address=0xYourAddress
   ```

---

## Makefile Commands

In the `contracts/` directory, the provided Makefile includes the following commands:

* **Compile contracts**

  Compiles all Solidity contracts:

  ```bash
  make compile
  ```

* **Start local Ethereum network**

  Starts a local Hardhat node:

  ```bash
  make localnet
  ```

* **Deploy contracts**

  Compiles and deploys contracts to the local Hardhat network:

  ```bash
  make deploy
  ```

* **Fund an address**

  Funds a specified address with 1000 ETH on the local Hardhat network:

  ```bash
  make fund address=0xYourAddress
  ```

---

## Features

* Send ETH to stealth addresses (privacy-focused transfers).
* Send ETH from stealth addresses.
* Manage your keys.
* View transaction history for selected addresses.
* Display balance for each address.
* Search transactions.

 