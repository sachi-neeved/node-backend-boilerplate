import { render } from "@react-email/render";
import nodemailer, { type Transporter } from "nodemailer";
import { createElement } from "react";
import { SMTP_FROM, SMTP_HOST, SMTP_PASS, SMTP_PORT, SMTP_USER } from "@/lib/constants";
import OtpEmail from "@/views/template/OtpEmail";
import WelcomeEmail from "@/views/template/WelcomeEmail";

class MailService {
	private transporterInstance: Transporter | null = null;

	private get transporter(): Transporter {
		this.transporterInstance ??= nodemailer.createTransport({
			host: SMTP_HOST,
			port: Number(SMTP_PORT) || 587,
			secure: Number(SMTP_PORT) === 465,
			auth: {
				user: SMTP_USER,
				pass: SMTP_PASS,
			},
			pool: true,
			maxConnections: 5,
			maxMessages: 100,
		});
		return this.transporterInstance;
	}

	private async send(to: string, subject: string, html: string) {
		await this.transporter.sendMail({ from: SMTP_FROM, to, subject, html });
	}

	async sendOtpEmail(to: string, firstName: string, otp: string) {
		const html = await render(createElement(OtpEmail, { firstName, otp }));
		await this.send(to, "Your NodeJS Boilerplate verification code", html);
	}

	async sendWelcomeEmail(to: string, firstName: string) {
		const html = await render(createElement(WelcomeEmail, { firstName }));
		await this.send(to, "Welcome to NodeJS Boilerplate", html);
	}
}

export default MailService;
