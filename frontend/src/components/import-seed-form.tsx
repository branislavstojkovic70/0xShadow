import {
	Box,
	Button,
	Container,
	IconButton,
	InputAdornment,
	Paper,
	Step,
	StepLabel,
	Stepper,
	TextField,
	Typography,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useFormik } from "formik";
import * as yup from "yup";
import { useState } from "react";
import toast from "react-hot-toast";
import { encryptMnemonic } from "../util/crypto";
import { saveEncryptedMnemonic } from "../util/storage";
import { usePassword } from "../context/password-context";
import { useNavigate } from "react-router-dom";
import { Mnemonic } from "ethers";

const steps = ["Enter Seed Phrase", "Set Password"];

export default function ImportSeedForm() {
	const [activeStep, setActiveStep] = useState(0);
	const [visibleInputs, setVisibleInputs] = useState<{ [key: number]: boolean }>({});
	const [mnemonic, setMnemonic] = useState("");
	const { setPassword: setSessionPassword } = usePassword();
	const navigate = useNavigate();

	const toggleVisibility = (index: number) => {
		setVisibleInputs((prev) => ({
			...prev,
			[index]: !prev[index],
		}));
	};

	const seedForm = useFormik({
		initialValues: Object.fromEntries(
			Array.from({ length: 12 }, (_, i) => [`word${i + 1}`, ""])
		),
		validationSchema: yup.object(
			Object.fromEntries(
				Array.from({ length: 12 }, (_, i) => [
					`word${i + 1}`,
					yup.string().required("Required").matches(/^[a-zA-Z]+$/, "Letters only"),
				])
			)
		),
		onSubmit: (values) => {
			const words = Object.values(values).map((w) => w.trim().toLowerCase());
			const phrase = words.join(" ");
			if (!Mnemonic.isValidMnemonic(phrase)) {
				toast.error("Invalid mnemonic.");
				return;
			}
			setMnemonic(phrase);
			setActiveStep(1);
		},
	});

	const passwordForm = useFormik({
		initialValues: { password: "", confirm: "" },
		validationSchema: yup.object({
			password: yup
				.string()
				.required("Password is required")
				.min(8, "Password must be at least 8 characters"),
			confirm: yup
				.string()
				.oneOf([yup.ref("password")], "Passwords must match")
				.required("Please confirm your password"),
		}),
		onSubmit: async (values) => {
			try {
				const { encrypted, salt, iv } = await encryptMnemonic(mnemonic, values.password);
				await saveEncryptedMnemonic(encrypted, salt,iv);
				setSessionPassword(values.password);
				toast.success("Wallet imported successfully!");
				navigate("/");
			} catch (err) {
				console.error(err);
				toast.error("Failed to encrypt and save wallet.");
			}
		},
	});

	return (
		<Container maxWidth="sm" sx={{ py: 6 }}>
			<Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
				{steps.map((label) => (
					<Step key={label}>
						<StepLabel>{label}</StepLabel>
					</Step>
				))}
			</Stepper>

			{activeStep === 0 && (
				<Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
					<Typography variant="h6" fontWeight={600} gutterBottom>
						Enter Your Seed Phrase
					</Typography>
					<Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
						Please enter your 12-word recovery phrase in the correct order.
					</Typography>
					<form onSubmit={seedForm.handleSubmit}>
						<Box
							sx={{
								display: "grid",
								gridTemplateColumns: "repeat(3, 1fr)",
								gap: 2,
								mt: 2,
							}}
						>
							{Array.from({ length: 12 }, (_, i) => {
								const name = `word${i + 1}`;
								const isVisible = visibleInputs[i] || false;

								return (
									<TextField
										key={name}
										label={`Word #${i + 1}`}
										name={name}
										type={isVisible ? "text" : "password"}
										value={seedForm.values[name]}
										onChange={seedForm.handleChange}
										onBlur={seedForm.handleBlur}
										error={seedForm.touched[name] && Boolean(seedForm.errors[name])}
										helperText={seedForm.touched[name] && seedForm.errors[name]}
										fullWidth
										InputProps={{
											endAdornment: (
												<InputAdornment position="end">
													<IconButton
														onClick={() => toggleVisibility(i)}
														edge="end"
														size="small"
													>
														{isVisible ? <VisibilityOff /> : <Visibility />}
													</IconButton>
												</InputAdornment>
											),
										}}
									/>
								);
							})}
						</Box>

						<Box sx={{ mt: 4 }}>
							<Button variant="contained" fullWidth type="submit">
								Continue
							</Button>
						</Box>
					</form>
				</Paper>
			)}

			{activeStep === 1 && (
				<Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
					<Typography variant="h6" fontWeight={600} gutterBottom>
						Set Your Password
					</Typography>
					<Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
						This password will be used to locally encrypt your wallet seed.
					</Typography>

					<form onSubmit={passwordForm.handleSubmit}>
						<Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
							<TextField
								label="Password"
								type="password"
								fullWidth
								{...passwordForm.getFieldProps("password")}
								error={
									passwordForm.touched.password && Boolean(passwordForm.errors.password)
								}
								helperText={
									passwordForm.touched.password && passwordForm.errors.password
								}
							/>
							<TextField
								label="Confirm Password"
								type="password"
								fullWidth
								{...passwordForm.getFieldProps("confirm")}
								error={
									passwordForm.touched.confirm && Boolean(passwordForm.errors.confirm)
								}
								helperText={
									passwordForm.touched.confirm && passwordForm.errors.confirm
								}
							/>
							<Button type="submit" variant="contained">
								Import Wallet
							</Button>
						</Box>
					</form>
				</Paper>
			)}
		</Container>
	);
}