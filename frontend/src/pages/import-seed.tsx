import { Container, Divider, Typography } from "@mui/material";
import ImportSeedForm from "../components/import-seed-form";

export default function ImportSeed() {
	return (
		<Container maxWidth="sm" sx={{ mt: 5 }}>
			<Typography variant="h4" fontWeight={600} textAlign="center" sx={{mb: 2}}>
				Import wallet
			</Typography>

			<Divider />
			<ImportSeedForm />
		</Container>
	);
}