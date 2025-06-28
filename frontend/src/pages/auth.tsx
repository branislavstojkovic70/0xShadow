import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadEncryptedMnemonic } from "../util/storage";

interface Props {
	children: React.ReactNode;
}

export default function Auth({ children }: Props) {
	const navigate = useNavigate();
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const checkAccess = async () => {
			const sessionPassword = sessionStorage.getItem("walletPassword");
			if (!sessionPassword) {
				navigate("/login");
				return;
			}

			const mnemonicData = await loadEncryptedMnemonic();
			if (!mnemonicData) {
				navigate("/seed");
				return;
			}

			setLoading(false);
		};

		checkAccess();
	}, [navigate]);

	if (loading) return null;

	return <>{children}</>;
}