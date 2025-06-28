import { ethers } from "ethers";
import {
	announcerAbi,
	announcerAddress,
	registryAbi,
	registryAddress,
} from "../config/contract-config";
import {
	deriveStealthAddress,
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


