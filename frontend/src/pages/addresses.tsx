import { Container } from "@mui/material";
import AddressList from "../components/address-list";

export default function Addresses() {
	return (
		<Container maxWidth="sm" sx={{ mt: 5 }}>
			<AddressList />
		</Container>
	);
}
