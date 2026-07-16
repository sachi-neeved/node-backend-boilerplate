import { afterEach, describe, expect, it, vi } from "vitest";
import OtpEmail from "@/views/template/OtpEmail";
import WelcomeEmail from "@/views/template/WelcomeEmail";
import MailService from "./mailService";

const { sendMailMock, createTransportMock, renderMock } = vi.hoisted(() => ({
	sendMailMock: vi.fn().mockResolvedValue(undefined),
	createTransportMock: vi.fn(),
	renderMock: vi.fn().mockResolvedValue("<html>rendered</html>"),
}));
createTransportMock.mockReturnValue({ sendMail: sendMailMock });

vi.mock("nodemailer", () => ({
	default: { createTransport: createTransportMock },
}));
vi.mock("@react-email/render", () => ({ render: renderMock }));
vi.mock("@/lib/constants", () => ({
	SMTP_HOST: "smtp.example.com",
	SMTP_PORT: "587",
	SMTP_USER: "smtp-user",
	SMTP_PASS: "smtp-pass",
	SMTP_FROM: "no-reply@example.com",
}));

afterEach(() => {
	vi.clearAllMocks();
});

describe("MailService.sendOtpEmail", () => {
	it("renders the OTP template and sends it to the given address", async () => {
		const mailService = new MailService();

		await mailService.sendOtpEmail("a@b.com", "Ada", "123456");

		expect(renderMock).toHaveBeenCalledWith(
			expect.objectContaining({ type: OtpEmail, props: { firstName: "Ada", otp: "123456" } }),
		);
		expect(sendMailMock).toHaveBeenCalledWith({
			from: "no-reply@example.com",
			to: "a@b.com",
			subject: "Your NodeJS Boilerplate verification code",
			html: "<html>rendered</html>",
		});
	});
});

describe("MailService.sendWelcomeEmail", () => {
	it("renders the welcome template and sends it to the given address", async () => {
		const mailService = new MailService();

		await mailService.sendWelcomeEmail("a@b.com", "Ada");

		expect(renderMock).toHaveBeenCalledWith(
			expect.objectContaining({ type: WelcomeEmail, props: { firstName: "Ada" } }),
		);
		expect(sendMailMock).toHaveBeenCalledWith({
			from: "no-reply@example.com",
			to: "a@b.com",
			subject: "Welcome to NodeJS Boilerplate",
			html: "<html>rendered</html>",
		});
	});
});

describe("MailService transporter", () => {
	it("creates the SMTP transporter lazily and reuses it across sends", async () => {
		const mailService = new MailService();

		await mailService.sendOtpEmail("a@b.com", "Ada", "111111");
		await mailService.sendWelcomeEmail("a@b.com", "Ada");

		expect(createTransportMock).toHaveBeenCalledTimes(1);
		expect(createTransportMock).toHaveBeenCalledWith(
			expect.objectContaining({
				host: "smtp.example.com",
				port: 587,
				secure: false,
				auth: { user: "smtp-user", pass: "smtp-pass" },
			}),
		);
	});

	it("marks the transporter secure when SMTP_PORT is 465", async () => {
		vi.resetModules();
		vi.doMock("@/lib/constants", () => ({
			SMTP_HOST: "smtp.example.com",
			SMTP_PORT: "465",
			SMTP_USER: "smtp-user",
			SMTP_PASS: "smtp-pass",
			SMTP_FROM: "no-reply@example.com",
		}));

		const { default: SecureMailService } = await import("./mailService");
		const mailService = new SecureMailService();
		await mailService.sendOtpEmail("a@b.com", "Ada", "111111");

		expect(createTransportMock).toHaveBeenCalledWith(expect.objectContaining({ secure: true }));
	});
});
