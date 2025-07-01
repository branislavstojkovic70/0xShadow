import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { CssBaseline, ThemeProvider } from "@mui/material";
import theme from "./theme";
import Seed from "./pages/seed";
import Home from "./pages/home";
import Send from "./pages/send";
import History from "./pages/history";
import Navbar from "./components/navbar";
import { PasswordProvider } from "./context/password-context";
import Auth from "./pages/auth";
import ImportSeed from "./pages/import-seed";
import Addresses from "./pages/addresses";
import Login from "./pages/login";
import Profile from "./pages/profile";

const router = createBrowserRouter([
	{
		path: "/",
		element: <Navbar />,
		children: [
			{
				path: "/",
				element: (
					<Auth>
						<Send />
					</Auth>
				),
			},
			{
				path: "/addresses",
				element: (
					<Auth>
						<Addresses />
					</Auth>
				),
			},
			{
				path: "/history",
				element: (
					<Auth>
						<History />
					</Auth>
				),
			},
			{
				path: "/profile",
				element: (
					<Auth>
						<Profile />
					</Auth>
				),
			},
		],
	},
	{
		path: "/home",
		element: <Home />,
	},
	{
		path: "/login",
		element: <Login />,
	},
	{
		path: "/seed",
		element: <Seed />,
	},
	{
		path: "/import-seed",
		element: <ImportSeed />,
	},
]);

createRoot(document.getElementById("root")!).render(
	<ThemeProvider theme={theme}>
		<PasswordProvider>
			<CssBaseline />
			<RouterProvider router={router} />
			<Toaster
				position="bottom-center"
				toastOptions={{
					success: {
						style: {
							background: theme.palette.success.main,
						},
					},
					error: {
						style: {
							background: theme.palette.error.main,
							color: "#F5F5F5",
						},
					},
				}}
			/>
		</PasswordProvider>
	</ThemeProvider>
);
