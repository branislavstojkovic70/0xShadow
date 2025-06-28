import CryptoJS from "crypto-js";
import { concat, getBytes, HDNodeWallet, hexlify, Mnemonic, SigningKey } from "ethers";
import { loadEncryptedMnemonic } from "./storage";

const KEY_SIZE = 256 / 32;
const PBKDF2_ITERATIONS = 10000;

export function deriveKey(
	password: string,
	salt: string
): CryptoJS.lib.WordArray {
	const passwordWA = CryptoJS.enc.Utf8.parse(password);
	const saltWA = CryptoJS.enc.Hex.parse(salt);
	return CryptoJS.PBKDF2(passwordWA, saltWA, {
		keySize: KEY_SIZE,
		iterations: PBKDF2_ITERATIONS,
		hasher: CryptoJS.algo.SHA256,
	});
}

export function encryptMnemonic(
	mnemonic: string,
	password: string
): {
	encrypted: string;
	salt: string;
	iv: string;
} {
	const salt = CryptoJS.lib.WordArray.random(16).toString(CryptoJS.enc.Hex);
	const iv = CryptoJS.lib.WordArray.random(16).toString(CryptoJS.enc.Hex);

	const key = deriveKey(password, salt);

	const mnemonicWA = CryptoJS.enc.Utf8.parse(mnemonic);

	const encrypted = CryptoJS.AES.encrypt(mnemonicWA, key, {
		iv: CryptoJS.enc.Hex.parse(iv),
		mode: CryptoJS.mode.CBC,
		padding: CryptoJS.pad.Pkcs7,
	}).toString();

	return { encrypted, salt, iv };
}

export function decryptMnemonic(
	encrypted: string,
	password: string,
	salt: string,
	iv: string
): string {
	const key = deriveKey(password, salt);

	const decrypted = CryptoJS.AES.decrypt(encrypted, key, {
		iv: CryptoJS.enc.Hex.parse(iv),
		mode: CryptoJS.mode.CBC,
		padding: CryptoJS.pad.Pkcs7,
	});

	const result = decrypted.toString(CryptoJS.enc.Utf8);

	if (!result) throw new Error("Invalid password or corrupted data");
	return result;
}

export interface KeyPair {
	privateKey: string;
	publicKey: string;
	address: string;
}

export interface WalletKeyPairs {
	master: KeyPair;
	spending: KeyPair;
	viewing: KeyPair;
}

export async function generateKeyPairs(
	password: string
): Promise<WalletKeyPairs> {
	const encryptedData = await loadEncryptedMnemonic();
	if (!encryptedData) throw new Error("No encrypted mnemonic found");
	const phrase = decryptMnemonic(
		encryptedData.encrypted,
		password,
		encryptedData.salt,
		encryptedData.iv
	);
	const mnemonic = Mnemonic.fromPhrase(phrase);
	const root = HDNodeWallet.fromMnemonic(mnemonic);
	const spendingNode = root.derivePath("0");
	const viewingNode = root.derivePath("1");

	return {
		master: {
			privateKey: root.privateKey,
			publicKey: root.publicKey,
			address: root.address
		},
		spending: {
			privateKey: spendingNode.privateKey,
			publicKey: spendingNode.publicKey,
			address: spendingNode.address,
		},
		viewing: {
			privateKey: viewingNode.privateKey,
			publicKey: viewingNode.publicKey,
			address: viewingNode.address,
		},
	};
}

export async function generateStealthMetaAddress(
	password: string
): Promise<string> {
	const { spending, viewing } = await generateKeyPairs(password);

	const compressedSpending = SigningKey.computePublicKey(
		spending.privateKey,
		true
	);
	const compressedViewing = SigningKey.computePublicKey(
		viewing.privateKey,
		true
	);

	const stealthMeta = hexlify(
		concat([getBytes(compressedSpending), getBytes(compressedViewing)])
	);

	console.log("Stealth:", `st:eth:${stealthMeta}`);

	return `${stealthMeta}`;
}