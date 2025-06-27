import { createRoot } from 'react-dom/client'
import { Toaster } from "react-hot-toast";
import './index.css'
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { CssBaseline, ThemeProvider } from '@mui/material';
import theme from './theme';
import Seed from './pages/seed';
import Home from './pages/home';
import Send from './pages/send';
import History from './pages/history';
import Navbar from './components/navbar';

const router = createBrowserRouter([
	{
		path: "/",
		element: <Navbar />,
		children: [
			{
				path: "/",
				element: (
					<Send />
				),
			},
			{
				path: "/history",
				element: (
					<History />
				),
			},
		],
	},
	{
		path: "/home",
		element: <Home />,
	},
	{
		path: "/seed",
		element: <Seed />,
	},
]);

createRoot(document.getElementById("root")!).render(
	<ThemeProvider theme={theme}>
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
	</ThemeProvider>
);
