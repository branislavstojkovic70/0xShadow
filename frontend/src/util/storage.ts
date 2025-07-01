import { set, get, del } from "idb-keyval";

export const saveEncryptedMnemonic = async (
	encrypted: string,
	salt: string,
	iv: string
) => {
	await set("walletSeed", { encrypted, salt,iv });
};

export const loadEncryptedMnemonic = async (): Promise<{
	encrypted: string;
	salt: string;
	iv:string;
} | null | undefined> => {
	return await get("walletSeed");
};

export const clearEncryptedMnemonic = async () => {
	await del("walletSeed");
};