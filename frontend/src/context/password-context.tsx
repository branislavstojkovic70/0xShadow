import React, { createContext, useContext, useState } from "react";

interface PasswordContextType {
	password: string | null;
	setPassword: (pw: string | null) => void;
}

const PasswordContext = createContext<PasswordContextType>({
	password: null,
	setPassword: () => {},
});

export const PasswordProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [password, setPassword] = useState<string | null>(null);

	return (
		<PasswordContext.Provider value={{ password, setPassword }}>
			{children}
		</PasswordContext.Provider>
	);
};

export const usePassword = () => useContext(PasswordContext);
