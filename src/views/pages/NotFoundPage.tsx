export { render } from "@react-email/render";
export { createElement as reactEmailCreateReactElement } from "react";

export default function NotFoundPage() {
	return (
		<html lang="en">
			<head>
				<meta charSet="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<title>404 Not Found</title>
			</head>
			<body style={styles.body}>
				<div style={styles.container}>
					<svg
						style={styles.icon}
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						role="img"
						aria-label="Error icon"
					>
						<title>Error icon</title>
						<path d="M12 2C6.48 2 2 6.48 2 12c0 5.52 4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
					</svg>
					<h1 style={styles.heading}>404 Not Found</h1>
					<p style={styles.text}>The requested URL was not found on this server.</p>
					<p style={styles.text}>Please check the URL and try again.</p>
					<a href="/" style={styles.link}>
						Go Back Home
					</a>
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
		width: "100px",
		height: "100px",
		fill: "#d9534f",
	},
	heading: {
		fontSize: "2em",
		color: "#d9534f",
	},
	text: {
		fontSize: "1.2em",
		color: "#555",
		lineHeight: "1.5",
	},
	link: {
		display: "inline-block",
		marginTop: "20px",
		padding: "10px 20px",
		backgroundColor: "#5bc0de",
		color: "white",
		textDecoration: "none",
		borderRadius: "5px",
	},
} as const;
