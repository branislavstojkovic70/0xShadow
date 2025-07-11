import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadEncryptedMnemonic } from "../util/storage";
import { usePassword } from "../context/password-context";

interface Props {
	children: React.ReactNode;
}

export default function Auth({ children }: Props) {
	const navigate = useNavigate();
	const [loading, setLoading] = useState(true);
	const { password } = usePassword();
	useEffect(() => {
		const checkAccess = async () => {
			const mnemonicData = await loadEncryptedMnemonic();
			if (!mnemonicData) {
				navigate("/home");
				return;
			}
			if (!password) {
				navigate("/login");
				return;
			}
			setLoading(false);
		};

		checkAccess();
	}, [navigate]);

	if (loading) return null;

	return <>{children}</>;
}