import React from "react";
import {
	Box,
	Button,
	TextField,
	Typography,
	CircularProgress,
	Divider,
	InputAdornment,
} from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";
import {
	sendFunds,
	getStealthAddressesWithBalance,
	sendFromStealthAddress,
	getMasterWalletBalance,
} from "../service/eth";
import { generateKeyPairs } from "../util/crypto";
import { usePassword } from "../context/password-context";

const validationSchema = Yup.object({
	sendTo: Yup.string().required("Recipient username is required"),
	amount: Yup.number()
		.required("Amount is required")
		.positive("Amount must be positive")
		.typeError("Amount must be a number"),
});

interface SenderOption {
	address: string;
	label: string;
	isStealth: boolean;
	balance: number;
	ephemeralPubKey?: string; // only for stealth
}

const ethFormatter = new Intl.NumberFormat("en", {
	minimumFractionDigits: 2,
	maximumFractionDigits: 6,
});

export default function SendForm() {
	const [loading, setLoading] = React.useState(false);
	const [loadingAddresses, setLoadingAddresses] = React.useState(true);
	const [senderOptions, setSenderOptions] = React.useState<SenderOption[]>(
		[]
	);
	const [selectedSender, setSelectedSender] = React.useState<string>("");
	const [selectedBalance, setSelectedBalance] = React.useState<number | null>(
		null
	);
	const { password } = usePassword();


	React.useEffect(() => {
		(async () => {
			try {
				setLoadingAddresses(true);
				const keys = await generateKeyPairs(password!);
				const stealths = await getStealthAddressesWithBalance(password!);
				const masterBalanceResult = await getMasterWalletBalance(
					password!
				);
				const masterBalance = parseFloat(masterBalanceResult.balance);

				const all: SenderOption[] = [
					{
						address: keys.master.address,
						label: `Master - ${keys.master.address}`,
						isStealth: false,
						balance: masterBalance,
					},
					...stealths.map((s) => ({
						address: s.stealthAddress,
						label: `Stealth - ${s.stealthAddress}`,
						isStealth: true,
						balance: parseFloat(s.balance),
						ephemeralPubKey: s.ephermalPubKey,
					})),
				];

				setSenderOptions(all);
				if (all.length) {
					setSelectedSender(all[0].address);
					setSelectedBalance(all[0].balance);
				}
			} catch (err) {
				console.error("Failed to load addresses:", err);
			} finally {
				setLoadingAddresses(false);
			}
		})();
	}, []);

	const handleSenderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const newAddress = e.target.value;
		setSelectedSender(newAddress);
		const selected = senderOptions.find((s) => s.address === newAddress);
		setSelectedBalance(selected ? selected.balance : null);
	};

	const formik = useFormik({
		initialValues: { sendTo: "", amount: "" },
		validationSchema,
		onSubmit: async (values) => {
			setLoading(true);
			try {
				

				const keyPairs = await generateKeyPairs(password!);
				const sender = senderOptions.find(
					(s) => s.address === selectedSender
				);
				if (!sender) throw new Error("Selected sender not found");

				const amountValue = values.amount.toString();

				if (!sender.isStealth) {
					await sendFunds(
						values.sendTo,
						amountValue,
						keyPairs.master.privateKey
					);
				} else {
					if (!sender.ephemeralPubKey)
						throw new Error("Missing ephemeral key");
					await sendFromStealthAddress(
						sender.ephemeralPubKey,
						values.sendTo,
						amountValue,
						sender.address,
						password!
					);
				}

				toast.success(
					`Sent ${ethFormatter.format(
						parseFloat(amountValue)
					)} ETH successfully!`
				);
			} catch (err) {
				console.error("Submission failed:", err);
				toast.error("Transaction failed.");
			} finally {
				setLoading(false);
			}
		},
	});

	return (
		<form onSubmit={formik.handleSubmit}>
			<Box
				sx={{ pt: 8, px: 2, display: "flex", justifyContent: "center" }}
			>
				<Box
					sx={{
						width: "100%",
						maxWidth: 600,
						display: "flex",
						flexDirection: "column",
						gap: 3,
					}}
				>
					<Typography
						variant="h4"
						fontWeight={600}
						textAlign="center"
					>
						Transfer Wallet Funds
					</Typography>

					<Divider />

					{/* Select FROM + Balance */}
					<Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
						<TextField
							fullWidth
							select
							label="Send From"
							value={selectedSender}
							//@ts-ignore
							onChange={handleSenderChange}
							SelectProps={{ native: true }}
							disabled={
								loading ||
								senderOptions.length === 0 ||
								loadingAddresses
							}
							InputProps={{
								startAdornment: loadingAddresses && (
									<InputAdornment
										position="start"
										sx={{ gap: 1 }}
									>
										<CircularProgress size={16} />
										<Typography variant="body2">
											Fetching addresses...
										</Typography>
									</InputAdornment>
								),
							}}
						>
							{senderOptions.map((opt) => (
								<option key={opt.address} value={opt.address}>
									{opt.label}
								</option>
							))}
						</TextField>

						<TextField
							label="Balance"
							value={
								selectedBalance !== null
									? `${ethFormatter.format(
										selectedBalance
									)} ETH`
									: "-"
							}
							InputProps={{ readOnly: true }}
							variant="outlined"
							sx={{ width: "180px" }}
							disabled
						/>
					</Box>

					{/* Recipient Username */}
					<TextField
						fullWidth
						label="Recipient username"
						name="sendTo"
						value={formik.values.sendTo}
						onChange={formik.handleChange}
						onBlur={formik.handleBlur}
						error={
							formik.touched.sendTo &&
							Boolean(formik.errors.sendTo)
						}
						helperText={
							formik.touched.sendTo && formik.errors.sendTo
						}
						disabled={loading}
					/>

					{/* Amount */}
					<TextField
						fullWidth
						label="Amount"
						name="amount"
						type="number"
						value={formik.values.amount}
						onChange={formik.handleChange}
						onBlur={formik.handleBlur}
						error={
							formik.touched.amount &&
							Boolean(formik.errors.amount)
						}
						helperText={
							formik.touched.amount && formik.errors.amount
						}
						disabled={loading}
						InputProps={{
							endAdornment: (
								<InputAdornment position="end">
									ETH
								</InputAdornment>
							),
							inputProps: { style: { appearance: "textfield" } },
							sx: {
								"& input::-webkit-outer-spin-button": {
									display: "none",
								},
								"& input::-webkit-inner-spin-button": {
									display: "none",
								},
								"& input[type=number]": {
									MozAppearance: "textfield",
								},
							},
						}}
					/>

					{/* Network (read-only) */}
					<TextField
						fullWidth
						label="Network"
						value="Ethereum"
						InputProps={{ readOnly: true }}
						disabled
					/>

					{/* Submit */}
					<Button
						type="submit"
						variant="contained"
						sx={{
							fontWeight: 600,
							textTransform: "none",
							height: "auto",
							gap: 1,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
						}}
						disabled={loading}
					>
						{loading && (
							<CircularProgress
								size={20}
								sx={{ color: "white" }}
							/>
						)}
						{loading ? "Processing..." : "Send"}
					</Button>
				</Box>
			</Box>
		</form>
	);
}