import { useEffect, useState } from "react";
import {
	Box,
	Card,
	IconButton,
	Tooltip,
	Typography,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	TextField,
	CircularProgress,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import VisibilityIcon from "@mui/icons-material/Visibility";
import QRCode from "react-qr-code";
import toast from "react-hot-toast";
import { generateKeyPairs, generateStealthMetaAddress } from "../util/crypto";
import { usePassword } from "../context/password-context";
import { getMasterWalletBalance, getUsername } from "../service/eth";
import { FaUserNinja } from "react-icons/fa";

export default function ProfileDetails() {
	const { password } = usePassword();
	const [visibleKeys, setVisibleKeys] = useState<{ [label: string]: boolean }>({});
	const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
	const [passwordInput, setPasswordInput] = useState("");
	const [pendingKeyLabel, setPendingKeyLabel] = useState<string | null>(null);
	const [keyGroups, setKeyGroups] = useState<any[]>([]);
	const [username, setUsername] = useState("shadow.eth");
	const [masterBalance, setMasterBalance] = useState("...");
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const loadKeys = async () => {
			if (!password) return;
			try {
				setIsLoading(true);

				const keys = await generateKeyPairs(password);
				const stealth = await generateStealthMetaAddress(password);

				const fetchedUsername = await getUsername(keys.master.address);
				setUsername(fetchedUsername);

				const { balance } = await getMasterWalletBalance(password);
				const formattedBalance = parseFloat(balance)
					.toFixed(6)
					.replace(/\.?0+$/, "");
				setMasterBalance(`${formattedBalance} ETH`);

				setKeyGroups([
					{
						title: "Master Keys",
						items: [
							{
								label: "Master Address",
								type: "address",
								explanation: "Primary Ethereum address used for transactions.",
								value: keys.master.address,
							},
							{
								label: "Master Private Key",
								type: "private",
								explanation: "Do NOT share this. It gives full control over your wallet.",
								value: keys.master.privateKey,
							},
						],
					},
					{
						title: "Stealth Meta Address",
						items: [
							{
								label: "Stealth Meta-Address",
								type: "address",
								explanation:
									"Combined public key used to derive one-time stealth addresses.",
								value: stealth,
							},
						],
					},
					{
						title: "Spending Keys",
						items: [
							{
								label: "Spending Address",
								type: "address",
								explanation: "Public address funds are sent to for spending.",
								value: keys.spending.address,
							},
							{
								label: "Spending Private Key",
								type: "private",
								explanation: "Do NOT share this. It allows spending funds.",
								value: keys.spending.privateKey,
							},
						],
					},
					{
						title: "Viewing Keys",
						items: [
							{
								label: "Viewing Address",
								type: "address",
								explanation:
									"Public address used to scan and detect incoming stealth txs.",
								value: keys.viewing.address,
							},
							{
								label: "Viewing Private Key",
								type: "private",
								explanation: "Do NOT share this. It can scan for stealth transactions.",
								value: keys.viewing.privateKey,
							},
						],
					},
				]);
			} catch (e) {
				toast.error("Failed to load keys.");
			} finally {
				setIsLoading(false);
			}
		};
		loadKeys();
	}, [password]);

	const handleCopy = async (value: string, label: string) => {
		if (label.includes("Private") && !visibleKeys[label]) {
			toast.error("You must unlock this key first.");
			return;
		}
		try {
			await navigator.clipboard.writeText(value);
			toast.success("Copied to clipboard.");
		} catch {
			toast.error("Copy failed.");
		}
	};

	const handleUnlockRequest = (label: string) => {
		setPendingKeyLabel(label);
		setPasswordDialogOpen(true);
	};

	const handlePasswordConfirm = () => {
		if (passwordInput === password) {
			setVisibleKeys((prev) => ({ ...prev, [pendingKeyLabel!]: true }));
			setPasswordDialogOpen(false);
			setPasswordInput("");
		} else {
			toast.error("Incorrect password");
		}
	};

	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				px: 2,
				pt: 6,
				boxSizing: "border-box",
			}}
		>
			{isLoading ? (
				<Box sx={{ mt: 10 }}>
					<CircularProgress size={48} />
				</Box>
			) : (
				<>
					<Card
						variant="outlined"
						sx={{
							p: 4,
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							width: "100%",
							maxWidth: 620,
							boxShadow: 2,
							borderRadius: 3,
							mb: 4,
						}}
					>
						<FaUserNinja style={{ color: "#58AD95", fontSize: "48px", marginBottom: "16px" }} />
						<Typography variant="h5" fontWeight={600}>
							{username}
						</Typography>
						<Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
							Your main account identity
						</Typography>
						<Typography variant="subtitle1" fontWeight={500} sx={{ mt: 2 }}>
							Master Balance: {masterBalance}
						</Typography>
					</Card>

					<Box
						sx={{
							width: "100%",
							height: "55vh",
							maxWidth: 620,
							flexGrow: 1,
							overflowY: "auto",
							pr: 1,
						}}
					>
						{keyGroups.map((group) => (
							<Box key={group.title} sx={{ width: "100%", mb: 5 }}>
								<Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
									{group.title}
								</Typography>
								{group.items.map((item: any) => (
									<Card
										key={item.label}
										variant="outlined"
										sx={{
											p: 2,
											mb: 2,
											display: "flex",
											gap: 2,
											boxShadow: 1,
											borderRadius: 2,
										}}
									>
										<QRCode value={item.value} size={80} />
										<Box sx={{ flexGrow: 1 }}>
											<Typography variant="subtitle2" fontWeight={600}>
												{item.label}
											</Typography>
											<Typography variant="body2" color="text.secondary">
												{item.explanation}
											</Typography>
											<Box
												sx={{
													display: "flex",
													alignItems: "center",
													gap: 1,
													mt: 1,
												}}
											>
												<TextField
													type={
														item.type === "private" &&
														!visibleKeys[item.label]
															? "password"
															: "text"
													}
													value={item.value}
													size="small"
													fullWidth
													InputProps={{ readOnly: true }}
												/>
												{item.type === "private" &&
													!visibleKeys[item.label] && (
														<Tooltip title="Unlock with password">
															<IconButton
																onClick={() =>
																	handleUnlockRequest(item.label)
																}
																size="small"
															>
																<VisibilityIcon fontSize="small" />
															</IconButton>
														</Tooltip>
													)}
												<Tooltip title="Copy">
													<IconButton
														onClick={() =>
															handleCopy(item.value, item.label)
														}
														size="small"
													>
														<ContentCopyIcon fontSize="small" />
													</IconButton>
												</Tooltip>
											</Box>
										</Box>
									</Card>
								))}
							</Box>
						))}
					</Box>
				</>
			)}

			<Dialog
				open={passwordDialogOpen}
				onClose={() => setPasswordDialogOpen(false)}
			>
				<DialogTitle>Enter Password to Unlock Key</DialogTitle>
				<DialogContent>
					<TextField
						type="password"
						fullWidth
						value={passwordInput}
						onChange={(e) => setPasswordInput(e.target.value)}
						autoFocus
					/>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setPasswordDialogOpen(false)}>Cancel</Button>
					<Button variant="contained" onClick={handlePasswordConfirm}>
						Unlock
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
}
