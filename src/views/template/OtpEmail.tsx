import {
	Body,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Preview,
	Section,
	Text,
} from "@react-email/components";

interface OtpEmailProps {
	readonly firstName: string;
	readonly otp: string;
}

export default function OtpEmail({ firstName, otp }: OtpEmailProps) {
	return (
		<Html lang="en">
			<Head />
			<Preview>Your Court Record verification code: {otp}</Preview>
			<Body style={styles.body}>
				<Container style={styles.container}>
					{/* ── Header ── */}
					<Section style={styles.header}>
						<Text style={styles.brand}>⚖️ Court Record</Text>
						<Text style={styles.tagline}>Secure Legal Record Management</Text>
					</Section>

					{/* ── Card ── */}
					<Section style={styles.card}>
						<Section style={styles.icon_wrap}>
							<Text style={styles.icon}>🔐</Text>
						</Section>

						<Heading style={styles.heading}>Email Verification</Heading>

						<Text style={styles.greeting}>Hi {firstName},</Text>
						<Text style={styles.body_text}>
							To verify your identity and access your Court Record account, enter the one-time code
							below. For your security, this code will expire in <strong>10 minutes</strong>.
						</Text>

						{/* ── OTP box ── */}
						<Section style={styles.otp_wrap}>
							<Text style={styles.otp_label}>VERIFICATION CODE</Text>
							<Text style={styles.otp_code}>{otp}</Text>
							<Text style={styles.otp_timer}>⏱&nbsp; Expires in 10 minutes</Text>
						</Section>

						<Hr style={styles.divider} />

						<Section style={styles.warning_row}>
							<Text style={styles.warning_icon}>⚠️</Text>
							<Text style={styles.security_note}>
								If you did not request this code, please ignore this email and ensure your account
								is secure. Court Record will never ask you to share this code.
							</Text>
						</Section>
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

	/* Card */
	card: {
		backgroundColor: "#FFFFFF",
		padding: "40px 40px 32px",
		borderLeft: "1px solid #E2E8F0",
		borderRight: "1px solid #E2E8F0",
	},
	icon_wrap: {
		textAlign: "center" as const,
	},
	icon: {
		fontSize: "52px",
		margin: "0 0 16px",
		lineHeight: "1",
	},
	heading: {
		color: "#1B2A4A",
		fontSize: "24px",
		fontWeight: "700",
		textAlign: "center" as const,
		margin: "0 0 28px",
	},
	greeting: {
		color: "#334155",
		fontSize: "16px",
		fontWeight: "600",
		margin: "0 0 6px",
	},
	body_text: {
		color: "#475569",
		fontSize: "15px",
		lineHeight: "24px",
		margin: "0 0 28px",
	},

	/* OTP box */
	otp_wrap: {
		backgroundColor: "#EEF2FF",
		borderRadius: "12px",
		padding: "28px 24px",
		textAlign: "center" as const,
		borderLeft: "5px solid #1B2A4A",
		margin: "0 0 28px",
	},
	otp_label: {
		color: "#64748B",
		fontSize: "11px",
		fontWeight: "700",
		letterSpacing: "2px",
		margin: "0 0 12px",
	},
	otp_code: {
		color: "#1B2A4A",
		fontSize: "46px",
		fontWeight: "800",
		letterSpacing: "16px",
		margin: "0 0 12px",
		lineHeight: "1.1",
	},
	otp_timer: {
		color: "#64748B",
		fontSize: "13px",
		margin: "0",
	},

	divider: {
		borderColor: "#E2E8F0",
		margin: "0 0 24px",
	},

	/* Security note */
	warning_row: {
		paddingLeft: "0",
	},
	warning_icon: {
		fontSize: "14px",
		margin: "0 0 4px",
		display: "inline",
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
