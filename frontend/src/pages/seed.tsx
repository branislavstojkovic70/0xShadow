import { Container, Divider, Typography } from "@mui/material";
import SeedForm from "../components/seed-form";

export default function Seed() {
	return (
		<Container maxWidth="sm" sx={{ mt: 5 }}>
			<Typography variant="h4" fontWeight={600} textAlign="center" sx={{mb: 2}}>
				Generate wallet
			</Typography>

			<Divider />
			<SeedForm />
		</Container>
	);
}
