import React, { createContext, useContext, useEffect, useState } from "react";


interface PasswordContextType {
	password: string | null;
	setPassword: (pw: string | null) => void;
}

const PasswordContext = createContext<PasswordContextType>({
	password: null,
	setPassword: () => {},
});
export const PasswordProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [password, setPasswordState] = useState<string | null>(null);

	useEffect(() => {
		const stored = sessionStorage.getItem("walletPassword");
		if (stored) setPasswordState(stored);
	}, []);

	const setPassword = (pw: string | null) => {
		if (pw) {
			sessionStorage.setItem("walletPassword", pw);
		} else {
			sessionStorage.removeItem("walletPassword");
		}
		setPasswordState(pw);
	};

	return (
		<PasswordContext.Provider value={{ password, setPassword }}>
			{children}
		</PasswordContext.Provider>
	);
};

export const usePassword = () => useContext(PasswordContext);