import { render } from "@react-email/render";
import nodemailer from "nodemailer";
import { createElement } from "react";
import { SMTP_FROM, SMTP_HOST, SMTP_PASS, SMTP_PORT, SMTP_USER } from "@/lib/constants";
import OtpEmail from "@/views/template/OtpEmail";
import WelcomeEmail from "@/views/template/WelcomeEmail";

class MailService {
	private get transporter() {
		return nodemailer.createTransport({
			host: SMTP_HOST,
			port: Number(SMTP_PORT) || 587,
			secure: Number(SMTP_PORT) === 465,
			auth: {
				user: SMTP_USER,
				pass: SMTP_PASS,
			},
		});
	}

	private async send(to: string, subject: string, html: string) {
		await this.transporter.sendMail({ from: SMTP_FROM, to, subject, html });
	}

	async sendOtpEmail(to: string, firstName: string, otp: string) {
		const html = await render(createElement(OtpEmail, { firstName, otp }));
		await this.send(to, "Your Court Record verification code", html);
	}

	async sendWelcomeEmail(to: string, firstName: string) {
		const html = await render(createElement(WelcomeEmail, { firstName }));
		await this.send(to, "Welcome to Court Record", html);
	}
}

export default MailService;
