import { createTheme, alpha } from "@mui/material";

const theme = createTheme({
	palette: {
		mode: "dark",

		primary: {
			main: "#58AD95",
			light: "#7CCAB2",
			dark: "#3A6554",
			contrastText: "#FFFFFF",
		},

		secondary: {
			main: "#BCBDBE", 
			light: "#D4D5D6",
			dark: "#6A7071",
			contrastText: "#141414",
		},

		background: {
			default: "#141414", 
			paper: "#1E1E1E", 
		},

		text: {
			primary: "#F5F5F5",
			secondary: alpha("#BCBDBE", 0.8),
			disabled: alpha("#BCBDBE", 0.5),
		},

		error: { main: "#DD3636" },
		warning: { main: "#FFB400" },
		info: { main: "#73818E" },
		success: { main: "#58AD95" },

		divider: alpha("#BCBDBE", 0.2),
	},

	typography: {
		fontFamily: ["Poppins", "Helvetica Neue", "Arial", "sans-serif"].join(
			","
		),
		h1: { fontWeight: 600 },
		h2: { fontWeight: 600 },
		h3: { fontWeight: 600 },
		button: { textTransform: "none", fontWeight: 600 },
	},

	components: {
		MuiButton: {
			styleOverrides: {
				containedPrimary: {
					backgroundColor: "#58AD95",
					color: "#141414",
					"&:hover": { backgroundColor: "#3A6554" },
				},
				containedSecondary: {
					backgroundColor: "#BCBDBE",
					color: "#141414",
					"&:hover": { backgroundColor: "#6A7071" },
				},
			},
		},
		MuiPaper: {
			styleOverrides: {
				root: {
					backgroundColor: "#1E1E1E",
				},
			},
		},
		MuiAppBar: {
			styleOverrides: {
				root: {
					backgroundColor: "#141414",
				},
			},
		},
		MuiDivider: {
			styleOverrides: {
				root: {
					backgroundColor: alpha("#BCBDBE", 0.2),
				},
			},
		},
	},
});


export default theme;
