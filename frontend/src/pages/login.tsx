import React from "react";
import {
	Box,
	Button,
	Paper,
	TextField,
	Typography,
	CircularProgress,
	InputAdornment,
	IconButton,
} from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useNavigate } from "react-router-dom";

import { loadEncryptedMnemonic } from "../util/storage";  
import { usePassword } from "../context/password-context"; 

const validationSchema = Yup.object({
	password: Yup.string()
		.required("Password is required")
		.min(6, "Minimum 6 characters"),
});

export default function Login() {
	const [loading, setLoading] = React.useState(false);
	const [showPassword, setShowPassword] = React.useState(false);
	const navigate = useNavigate();
	const { setPassword } = usePassword();

	const togglePasswordVisibility = () => setShowPassword((pv) => !pv);

	const formik = useFormik({
		initialValues: { password: "" },
		validationSchema,
		onSubmit: async (values) => {
			setLoading(true);
			try {
				const encryptedData = await loadEncryptedMnemonic();
				if (!encryptedData) {
					setPassword?.(values.password);
					navigate("/home");
					return;
				}

				setPassword?.(values.password);
				navigate("/");
			} catch (err) {
				console.error("Login error:", err);
			} finally {
				setLoading(false);
			}
		},
	});

	return (
		<Box
			sx={{
				pt: 8,
				px: 2,
				minHeight: "80vh",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			<Paper
				elevation={3}
				sx={{
					p: 4,
					width: "100%",
					maxWidth: 600,
					textAlign: "center",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					gap: 3,
				}}
			>
				<img
					src="/logo-grass.png"
					alt="Logo"
					style={{ width: "auto", height: "30vh" }}
				/>

				<Typography variant="h4" fontWeight={600}>
					Login to 0xShadow
				</Typography>

				<form onSubmit={formik.handleSubmit} style={{ width: "100%" }}>
					<Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
						<TextField
							fullWidth
							label="Password"
							type={showPassword ? "text" : "password"}
							{...formik.getFieldProps("password")}
							error={formik.touched.password && Boolean(formik.errors.password)}
							helperText={formik.touched.password && formik.errors.password}
							disabled={loading}
							InputProps={{
								endAdornment: (
									<InputAdornment position="end">
										<IconButton
											onClick={togglePasswordVisibility}
											edge="end"
											disabled={loading}
										>
											{showPassword ? <VisibilityOff /> : <Visibility />}
										</IconButton>
									</InputAdornment>
								),
							}}
						/>

						<Button
							type="submit"
							variant="contained"
							fullWidth
							disabled={loading}
							sx={{
								fontWeight: 600,
								textTransform: "none",
								gap: 1,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							{loading && <CircularProgress size={20} sx={{ color: "white" }} />}
							{loading ? "Logging in..." : "Login"}
						</Button>
					</Box>
				</form>
			</Paper>
		</Box>
	);
}