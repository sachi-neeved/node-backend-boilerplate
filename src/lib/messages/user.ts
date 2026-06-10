const UserMessages = {
	USER_CREATED: "User created successfully",
	USER_UPDATED: "User updated successfully",
	USER_DELETED: "User deleted successfully",
	USER_FETCHED: "User fetched successfully",
	USER_NOT_FOUND: "User not found",
	USER_DATA_MISSING: "User data is missing",
	USER_ALREADY_EXISTS: "User already exists",
	USER_INVALID_SESSION: "Invalid session",
	INVALID_CREDENTIALS: "Invalid email or password",
	EMAIL_NOT_VERIFIED: "Please verify your email before logging in",
	OTP_SENT: "Verification code sent to your email",
	OTP_INVALID: "Invalid or expired verification code",
	ALREADY_VERIFIED: "Email is already verified",
	OTP_RESENT: "Verification code resent to your email",
	OTP_RESEND_TOO_SOON: "Please wait before requesting another code",
} as const;

export default UserMessages;
