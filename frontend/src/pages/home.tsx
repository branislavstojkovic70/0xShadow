import {
	Button,
	Container,
	Typography,
	Stack,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function Home() {
	const navigate = useNavigate();

	return (
		<Container
			maxWidth="md"
			sx={{
				py: 10,
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				textAlign: "center",
			}}
		>
			<img
				src="/logo-grass.png"
				alt="0xShadow Logo"
				style={{ height: "30vh", width: "auto", marginBottom: "2rem" }}
			/>

			<Typography variant="h2" fontWeight={600} gutterBottom sx={{ fontSize: "44px" }}>
				Welcome to 0xShadow
			</Typography>

			<Typography
				variant="h6"
				color="text.secondary"
				sx={{ maxWidth: 600, mb: 5, textAlign: "justify" }}
			>
				A privacy-first Ethereum wallet using stealth addresses. Receive
				and claim crypto assets anonymously, without revealing your
				identity on-chain.
			</Typography>

			<Typography
				variant="h6"
				color="text.secondary"
				sx={{ maxWidth: 600, mb: 5, textAlign: "justify" }}
			>
				Choose how you want to access your wallet. You can import an existing one using a seed phrase or create a brand new wallet secured with a password.
			</Typography>

			<Stack spacing={3} direction={{ xs: "column", sm: "row" }} width="100%" justifyContent="center">
				<Button
					variant="outlined"
					size="large"
					onClick={() => navigate("/import-seed")}
					sx={{ px: 4, py: 1.5, fontWeight: 600, fontSize: "1rem" }}
				>
					Import Existing Wallet
				</Button>

				<Button
					variant="contained"
					size="large"
					onClick={() => navigate("/seed")}
					sx={{ px: 4, py: 1.5, fontWeight: 600, fontSize: "1rem" }}
				>
					Create New Wallet
				</Button>
			</Stack>
		</Container>
	);
}