import { Container } from "@mui/material";
import SendForm from "../components/send-form";

export default function Send() {
	return (
		<Container maxWidth="sm" sx={{ mt: 5 }}>
			<SendForm />
		</Container>
	);
}