import { Container } from "@mui/material";
import ProfileDetails from "../components/profile-details";

export default function Profile() {
	return (
		<Container maxWidth="lg" sx={{ mt: 5 }}>
			
			<ProfileDetails />
		</Container>
	);
}
