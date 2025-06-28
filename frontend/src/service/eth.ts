import { ethers } from "ethers";
import {
	registryAbi,
	registryAddress,
} from "../config/contract-config";
import {
	generateKeyPairs,
} from "../util/crypto";

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


