import { useEffect, useState } from "react";
import {
	Box,
	Card,
	IconButton,
	Tooltip,
	Typography,
	Divider,
	CircularProgress,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import QRCode from "react-qr-code";
import toast from "react-hot-toast";
import { getStealthAddressesWithBalance } from "../service/eth";

const ethFormatter = new Intl.NumberFormat("en", {
	minimumFractionDigits: 2,
	maximumFractionDigits: 6,
});

export default function AddressList() {
	const [addresses, setAddresses] = useState<
		{ address: string; balance: number }[]
	>([]);
	const [loading, setLoading] = useState(true);
	const [totalBalance, setTotalBalance] = useState<number>(0);

	const handleCopy = async (address: string) => {
		try {
			await navigator.clipboard.writeText(address);
			toast.success("Address copied.");
		} catch {
			toast.error("Copy failed.");
		}
	};

	useEffect(() => {
		(async () => {
			setLoading(true);
			try {
				const result = await getStealthAddressesWithBalance();
				const parsed = result
					.map((r) => ({
						address: r.stealthAddress,
						balance: parseFloat(r.balance),
					}))
					.filter((a) => a.balance > 0);

				const total = parsed.reduce((sum, a) => sum + a.balance, 0);

				setAddresses(parsed);
				setTotalBalance(total);
			} catch (err) {
				console.error("Failed to fetch stealth addresses:", err);
				toast.error("Failed to load addresses");
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	return (
		<Box
			sx={{
				pt: 8,
				px: 2,
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
			}}
		>
			<Typography variant="h4" fontWeight={600} gutterBottom>
				My Stealth addresses
			</Typography>

			<Typography
				variant="subtitle1"
				color="text.secondary"
				sx={{ mb: 2 }}
			>
				Total Balance: {ethFormatter.format(totalBalance)} ETH
			</Typography>

			<Divider sx={{ mb: 3, width: "100%", maxWidth: 600 }} />

			{loading ? (
				<CircularProgress />
			) : (
				addresses.map((acc) => (
					<Card
						key={acc.address}
						variant="outlined"
						sx={{
							display: "flex",
							alignItems: "center",
							p: 2,
							mb: 3,
							gap: 3,
							width: "100%",
							maxWidth: 600,
							backgroundColor: "background.paper",
							boxShadow: 1,
							borderRadius: 2,
						}}
					>
						<Box sx={{ flexShrink: 0 }}>
							<QRCode value={acc.address} size={88} />
						</Box>

						<Divider
							orientation="vertical"
							sx={{ height: 88, alignSelf: "center" }}
						/>

						<Box
							sx={{
								flexGrow: 1,
								display: "flex",
								flexDirection: "column",
								justifyContent: "center",
							}}
						>
							<Box
								sx={{
									display: "flex",
									alignItems: "center",
									gap: 1,
									color: "text.secondary",
									justifyContent: "space-between",
									overflow: "hidden",
									whiteSpace: "nowrap",
								}}
							>
								<Box
									sx={{
										overflow: "hidden",
										textOverflow: "ellipsis",
										whiteSpace: "nowrap",
										flexGrow: 1,
										maxWidth: "300px",
									}}
								>
									<Typography variant="body2" noWrap>
										{acc.address}
									</Typography>
								</Box>
								<Tooltip title="Copy address">
									<IconButton
										onClick={() => handleCopy(acc.address)}
										size="small"
									>
										<ContentCopyIcon fontSize="small" />
									</IconButton>
								</Tooltip>
							</Box>
							<Typography
								variant="subtitle2"
								color="text.primary"
							>
								{ethFormatter.format(acc.balance)} ETH
							</Typography>
						</Box>
					</Card>
				))
			)}
		</Box>
	);
}
