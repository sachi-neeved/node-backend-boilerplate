export { render } from "@react-email/render";
export { createElement as reactEmailCreateReactElement } from "react";

import {
	Body,
	Button,
	Column,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Preview,
	Row,
	Section,
	Text,
} from "@react-email/components";

interface WelcomeEmailProps {
	readonly firstName: string;
}

const features = [
	{
		icon: "📁",
		title: "Secure Documents",
		desc: "Upload and manage legal documents with end-to-end encryption.",
	},
	{
		icon: "⚖️",
		title: "Case Tracking",
		desc: "Monitor your case status and hearing schedules in real time.",
	},
	{
		icon: "✅",
		title: "Verified Records",
		desc: "Access certified, tamper-proof court records at any time.",
	},
];

export default function WelcomeEmail({ firstName }: WelcomeEmailProps) {
	return (
		<Html lang="en">
			<Head />
			<Preview>Welcome to Court Record — your account is ready, {firstName}!</Preview>
			<Body style={styles.body}>
				<Container style={styles.container}>
					{/* ── Header ── */}
					<Section style={styles.header}>
						<Text style={styles.brand}>⚖️ Court Record</Text>
						<Text style={styles.tagline}>Secure Legal Record Management</Text>
					</Section>

					{/* ── Hero ── */}
					<Section style={styles.hero}>
						<Text style={styles.hero_icon}>🎉</Text>
						<Heading style={styles.hero_heading}>Welcome, {firstName}!</Heading>
						<Text style={styles.hero_sub}>
							Your Court Record account is all set. You now have secure access to a modern legal
							record management platform built for clarity, compliance, and trust.
						</Text>
					</Section>

					{/* ── Features ── */}
					<Section style={styles.features_section}>
						<Text style={styles.features_label}>WHAT YOU CAN DO</Text>
						{features.map((f) => (
							<Section key={f.title} style={styles.feature_row}>
								<Row>
									<Column style={styles.feature_icon_col}>
										<Text style={styles.feature_icon}>{f.icon}</Text>
									</Column>
									<Column style={styles.feature_text_col}>
										<Text style={styles.feature_title}>{f.title}</Text>
										<Text style={styles.feature_desc}>{f.desc}</Text>
									</Column>
								</Row>
							</Section>
						))}
					</Section>

					{/* ── CTA ── */}
					<Section style={styles.cta_section}>
						<Button style={styles.cta_button} href="#">
							Access Your Account →
						</Button>
					</Section>

					{/* ── Divider + security note ── */}
					<Section style={styles.card_bottom}>
						<Hr style={styles.divider} />
						<Text style={styles.security_note}>
							If you did not create this account, please contact our support team immediately so we
							can secure your information.
						</Text>
					</Section>

					{/* ── Footer ── */}
					<Section style={styles.footer}>
						<Text style={styles.footer_copy}>
							© {new Date().getFullYear()} Court Record &nbsp;·&nbsp; All rights reserved
						</Text>
						<Text style={styles.footer_links}>
							Privacy Policy &nbsp;·&nbsp; Terms of Service &nbsp;·&nbsp; Support
						</Text>
					</Section>
				</Container>
			</Body>
		</Html>
	);
}

const styles = {
	body: {
		backgroundColor: "#F1F5F9",
		fontFamily:
			"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
		margin: "0",
		padding: "0",
	},
	container: {
		maxWidth: "560px",
		margin: "0 auto",
		padding: "40px 16px",
	},

	/* Header */
	header: {
		backgroundColor: "#1B2A4A",
		borderRadius: "12px 12px 0 0",
		padding: "28px 32px 20px",
		textAlign: "center" as const,
	},
	brand: {
		color: "#C9A84C",
		fontSize: "22px",
		fontWeight: "700",
		letterSpacing: "0.5px",
		margin: "0 0 4px",
	},
	tagline: {
		color: "#94A3B8",
		fontSize: "12px",
		letterSpacing: "1px",
		textTransform: "uppercase" as const,
		margin: "0",
	},

	/* Hero */
	hero: {
		backgroundColor: "#FFFFFF",
		padding: "40px 40px 32px",
		textAlign: "center" as const,
		borderLeft: "1px solid #E2E8F0",
		borderRight: "1px solid #E2E8F0",
		borderBottom: "1px solid #E2E8F0",
	},
	hero_icon: {
		fontSize: "52px",
		margin: "0 0 16px",
		lineHeight: "1",
	},
	hero_heading: {
		color: "#1B2A4A",
		fontSize: "26px",
		fontWeight: "700",
		margin: "0 0 16px",
	},
	hero_sub: {
		color: "#475569",
		fontSize: "15px",
		lineHeight: "25px",
		margin: "0",
	},

	/* Features */
	features_section: {
		backgroundColor: "#FFFFFF",
		padding: "28px 40px 8px",
		borderLeft: "1px solid #E2E8F0",
		borderRight: "1px solid #E2E8F0",
	},
	features_label: {
		color: "#94A3B8",
		fontSize: "11px",
		fontWeight: "700",
		letterSpacing: "2px",
		margin: "0 0 20px",
	},
	feature_row: {
		marginBottom: "20px",
		padding: "16px",
		backgroundColor: "#F8FAFC",
		borderRadius: "10px",
		borderLeft: "4px solid #C9A84C",
	},
	feature_icon_col: {
		width: "48px",
		verticalAlign: "top" as const,
	},
	feature_icon: {
		fontSize: "28px",
		margin: "0",
		lineHeight: "1.3",
	},
	feature_text_col: {
		verticalAlign: "top" as const,
		paddingLeft: "8px",
	},
	feature_title: {
		color: "#1B2A4A",
		fontSize: "14px",
		fontWeight: "700",
		margin: "0 0 4px",
	},
	feature_desc: {
		color: "#64748B",
		fontSize: "13px",
		lineHeight: "19px",
		margin: "0",
	},

	/* CTA */
	cta_section: {
		backgroundColor: "#FFFFFF",
		padding: "8px 40px 32px",
		textAlign: "center" as const,
		borderLeft: "1px solid #E2E8F0",
		borderRight: "1px solid #E2E8F0",
	},
	cta_button: {
		backgroundColor: "#1B2A4A",
		borderRadius: "8px",
		color: "#C9A84C",
		fontSize: "15px",
		fontWeight: "700",
		textDecoration: "none",
		padding: "14px 36px",
		display: "inline-block",
		letterSpacing: "0.5px",
	},

	/* Bottom of card */
	card_bottom: {
		backgroundColor: "#FFFFFF",
		padding: "0 40px 32px",
		borderLeft: "1px solid #E2E8F0",
		borderRight: "1px solid #E2E8F0",
	},
	divider: {
		borderColor: "#E2E8F0",
		margin: "0 0 20px",
	},
	security_note: {
		color: "#94A3B8",
		fontSize: "13px",
		lineHeight: "20px",
		margin: "0",
	},

	/* Footer */
	footer: {
		backgroundColor: "#1B2A4A",
		borderRadius: "0 0 12px 12px",
		padding: "20px 32px",
		textAlign: "center" as const,
	},
	footer_copy: {
		color: "#64748B",
		fontSize: "12px",
		margin: "0 0 6px",
	},
	footer_links: {
		color: "#C9A84C",
		fontSize: "12px",
		margin: "0",
	},
} as const;
