export { render } from "@react-email/render";
export { createElement as reactEmailCreateReactElement } from "react";

export default function HomePage() {
	return (
		<html lang="en">
			<head>
				<meta charSet="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<title>Home</title>
			</head>
			<body style={styles.body}>
				<div style={styles.container}>
					<svg
						style={styles.icon}
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						role="img"
						aria-label="Backend status icon"
					>
						<title>Backend status icon</title>
						<path d="M3 3h18v18H3V3zm2 2v14h14V5H5zm6 9h4v2h-4v-2zm0-3h4v2h-4v-2zm0-3h4v2h-4v-2z" />
						<circle cx="18" cy="18" r="1.5" fill="green" />
					</svg>
					<h1 style={styles.heading}>Backend Home</h1>
					<p style={styles.text}>The backend service is connected and running!</p>
				</div>
			</body>
		</html>
	);
}

const styles = {
	body: {
		fontFamily: "Arial, sans-serif",
		backgroundColor: "#f4f4f9",
		color: "#333",
		margin: "0",
		padding: "0",
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
		height: "100vh",
		textAlign: "center" as const,
	},
	container: {
		backgroundColor: "#ffffff",
		borderRadius: "8px",
		boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
		padding: "2rem",
		width: "80%",
		maxWidth: "600px",
	},
	icon: {
		width: "80px",
		height: "80px",
		fill: "#4a90e2",
	},
	heading: {
		fontSize: "3rem",
		marginBottom: "0.5rem",
		marginTop: "0.5rem",
		color: "#4a90e2",
	},
	text: {
		fontSize: "1.5rem",
		margin: "0",
		color: "#555",
	},
} as const;
