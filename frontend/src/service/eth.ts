import { ethers, formatEther } from "ethers";
import {
	announcerAbi,
	announcerAddress,
	registryAbi,
	registryAddress,
} from "../config/contract-config";
import {
	deriveStealthAddress,
	deriveStealthPrivateKey,
	generateKeyPairs,
	getSharedSecret,
} from "../util/crypto";
import { VALID_SCHEME_ID } from "@scopelift/stealth-address-sdk";

export async function checkUsernameExists(username: string): Promise<boolean> {
	const provider = (await createSystemSigner()).provider;
	const contract = new ethers.Contract(
		registryAddress,
		registryAbi,
		provider
	);
	return await contract.usernameExists(username);
}

export async function registerUsername(
	username: string,
	stealthMetaAddress: string
): Promise<ethers.TransactionResponse> {
	const { master } = await generateKeyPairs(
		sessionStorage.getItem("walletPassword")!
	);
	const signer = (await createSystemSigner()).signer;
	const contract = new ethers.Contract(registryAddress, registryAbi, signer);
	const tx = await contract.registerUsername(
		master.address,
		username,
		stealthMetaAddress
	);
	return tx;
}

export async function createSigner(privateKey: string): Promise<{
	signer: ethers.Signer;
	provider: ethers.JsonRpcProvider;
}> {
	const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
	const signer = new ethers.Wallet(privateKey, provider);
	return { signer, provider };
}

export async function createSystemSigner(): Promise<{
	signer: ethers.Signer;
	provider: ethers.JsonRpcProvider;
}> {
	const privateKey =
		"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
	const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
	const signer = new ethers.Wallet(privateKey, provider);
	return { signer, provider };
}

export async function getMasterWalletBalance(password: string): Promise<{
	address: string;
	balance: string;
}> {
	const { master } = await generateKeyPairs(password);
	console.log(master.address)
	const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

	const balance = await provider.getBalance(master.address);

	return {
		address: master.address,
		balance: ethers.formatEther(balance),
	};
}

export async function getMetaByUsername(username: string): Promise<string> {
	const signer = (await createSystemSigner()).signer;
	const contract = new ethers.Contract(registryAddress, registryAbi, signer);
	const metaAddress: string = await contract.usernameToStealthMetaAddress(
		username
	);
	return metaAddress;
}

export async function sendFunds(
	username: string,
	amountInEth: string,
	privateKey: string
) {
	const { signer } = await createSigner(privateKey);

	// 1. Fetch stealth meta address (encoded as bytes)
	const stealthMetaAddressBytes = await getMetaByUsername(username);
	if (!stealthMetaAddressBytes || stealthMetaAddressBytes === "0x") {
		throw new Error("Stealth meta address not found for username");
	}

	// 2. Decode stealth meta address → viewingPub + spendingPub
	const raw = stealthMetaAddressBytes.startsWith("0x")
		? stealthMetaAddressBytes.slice(2)
		: stealthMetaAddressBytes;

	const spendingPub = "0x" + raw.slice(0, 66);
	const viewingPub = "0x" + raw.slice(66, 132);

	// 3. Ephemeral key pair
	const ephemeralWallet = ethers.Wallet.createRandom();
	const ephemeralPrivateKey = ephemeralWallet.privateKey;
	const ephemeralPublicKey = ephemeralWallet.publicKey;

	// 4. Shared secret (ECDH with viewing key)
	const sharedSecret = await getSharedSecret(ephemeralPrivateKey, viewingPub);

	// 5. Derive stealth address using spending pub key + shared secret
	const stealthAddress = await deriveStealthAddress(
		spendingPub,
		sharedSecret
	);

	// 6. Send ETH to stealth address
	const address = await signer.getAddress();
	const latestNonce = await signer.provider!.getTransactionCount(
		address,
		"latest"
	);
	const tx = await signer.sendTransaction({
		to: stealthAddress,
		value: ethers.parseEther(amountInEth.toString()),
		nonce: latestNonce,
	});
	await tx.wait();
	console.log(
		`Sent ${amountInEth} ETH to stealth address: ${stealthAddress}`
	);

	// 7. Announce ephemeral public key (compressed) and metadata
	const announceContract = new ethers.Contract(
		announcerAddress,
		announcerAbi,
		signer
	);
	const schemeId = VALID_SCHEME_ID.SCHEME_ID_1;
	const metadata = "0x";

	const pubKeyBytes = ethers.hexlify(ethers.getBytes(ephemeralPublicKey));
	const annTx = await announceContract.announce(
		schemeId,
		stealthAddress,
		pubKeyBytes,
		metadata
	);
	await annTx.wait();

	console.log(`Announcement emitted for stealth address: ${stealthAddress}`);
}

export async function fetchMyStealthAnnouncements(): Promise<
	{
		stealthAddress: string;
		ephemeralPubKey: string;
		txHash: string;
	}[]
> {
	const password = sessionStorage.getItem("walletPassword");
	if (!password) throw new Error("No wallet password in session");

	const { spending, viewing } = await generateKeyPairs(password);

	const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
	const contract = new ethers.Contract(
		announcerAddress,
		announcerAbi,
		provider
	);

	const filter = contract.filters.Announcement(VALID_SCHEME_ID.SCHEME_ID_1);
	const logs = await contract.queryFilter(filter, 0, "latest");

	const myAnnouncements: {
		stealthAddress: string;
		ephemeralPubKey: string;
		txHash: string;
	}[] = [];

	for (const log of logs) {
		try {
			const parsed = contract.interface.parseLog(log);
			const stealthAddress = parsed!.args.stealthAddress;
			const ephemeralPubKey = parsed!.args.ephemeralPubKey;

			// 1. derive shared secret
			const sharedSecret = await getSharedSecret(
				viewing.privateKey,
				ephemeralPubKey
			);

			// 2. derive stealth address
			const derivedStealth = await deriveStealthAddress(
				spending.publicKey,
				sharedSecret
			);

			// 3. check if this address matches
			if (
				ethers.getAddress(stealthAddress) ===
				ethers.getAddress(derivedStealth)
			) {
				myAnnouncements.push({
					stealthAddress: derivedStealth,
					ephemeralPubKey,
					txHash: log.transactionHash,
				});
			}
		} catch (err) {
			continue;
		}
	}

	return myAnnouncements;
}

export async function getStealthAddressesWithBalance(): Promise<
	{
		stealthAddress: string;
		balance: string;
		txHash: string;
		ephermalPubKey: string;
	}[]
> {
	const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
	const myAnnouncements = await fetchMyStealthAnnouncements();

	const addressesWithBalance: {
		stealthAddress: string;
		balance: string;
		txHash: string;
		ephermalPubKey: string;
	}[] = [];

	for (const announcement of myAnnouncements) {
		const balance = await provider.getBalance(announcement.stealthAddress);
		if (balance > 0n) {
			addressesWithBalance.push({
				stealthAddress: announcement.stealthAddress,
				balance: ethers.formatEther(balance),
				txHash: announcement.txHash,
				ephermalPubKey: announcement.ephemeralPubKey,
			});
		}
	}

	return addressesWithBalance;
}

export async function sendFromStealthAddress(
	ephemeralPubKey: string,
	to: string,
	amountInEth: string,
	stealthAddress: string
): Promise<void> {
	const password = sessionStorage.getItem("walletPassword");
	if (!password) throw new Error("Missing password");
	const { spending, viewing } = await generateKeyPairs(password);
	const stealthPrivKey = await deriveStealthPrivateKey(
		spending.privateKey,
		viewing.privateKey,
		ephemeralPubKey
	);
	const wallet = new ethers.Wallet(stealthPrivKey);
	if (wallet.address !== stealthAddress) {
		throw new Error("Mismatch in stealth address derivation");
	}

	sendFunds(to, amountInEth, stealthPrivKey);
}


export interface TxInfo {
	hash: string;
	to: string;
	value: string;
	timestamp: string;
}


export async function fetchTransactionsForAddress(
	address: string,
	blocksToScan: number = 1000
): Promise<TxInfo[]> {
	const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
	const latestBlock = await provider.getBlockNumber();
	const parsed: TxInfo[] = [];

	for (let i = latestBlock; i >= Math.max(0, latestBlock - blocksToScan); i--) {
		const block = await provider.getBlock(i, true);
		if (!block || !block.prefetchedTransactions) continue;

		for (const tx of block.prefetchedTransactions) {
			if (
				tx.from.toLowerCase() !== address.toLowerCase() ||
				tx.value === 0n
			)
				continue;

			parsed.push({
				hash: tx.hash,
				to: tx.to || "0x0",
				value: parseFloat(formatEther(tx.value)).toFixed(5),
				timestamp: new Date(Number(block.timestamp) * 1000).toLocaleString(
					"en-GB",
					{
						day: "2-digit",
						month: "2-digit",
						year: "numeric",
						hour: "2-digit",
						minute: "2-digit",
						hour12: false,
					}
				),
			});
		}
	}

	return parsed.reverse();
}
