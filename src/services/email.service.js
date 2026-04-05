const nodemailer = require("nodemailer");
const { logger, getErrorMeta } = require("../utils/logger.util");

const envConfig = require("../config/env.config");

function createTransporter() {
	if (!envConfig.EMAIL_USER) {
		logger.warn("Email transporter disabled: EMAIL_USER is missing");
		return null;
	}

	if (envConfig.EMAIL_PASS) {
		return nodemailer.createTransport({
			service: "gmail",
			auth: {
				user: envConfig.EMAIL_USER,
				pass: envConfig.EMAIL_PASS,
			},
		});
	}

	if (
		envConfig.CLIENT_ID &&
		envConfig.CLIENT_SECRET &&
		envConfig.REFRESH_TOKEN
	) {
		return nodemailer.createTransport({
			service: "gmail",
			auth: {
				type: "OAuth2",
				user: envConfig.EMAIL_USER,
				clientId: envConfig.CLIENT_ID,
				clientSecret: envConfig.CLIENT_SECRET,
				refreshToken: envConfig.REFRESH_TOKEN,
			},
		});
	}

	logger.warn(
		"Email transporter disabled: configure EMAIL_PASS or OAuth2 credentials",
	);

	return null;
}

const transporter = createTransporter();

if (transporter) {
	transporter.verify((error) => {
		if (error) {
			logger.error("Email server connection failed", {
				error: getErrorMeta(error),
			});
		} else {
			logger.info("Email server is ready to send messages");
		}
	});
}

// Function to send email
const sendEmail = async (to, subject, text, html) => {
	if (!transporter) {
		throw new Error("Email transporter is not configured");
	}

	try {
		const info = await transporter.sendMail({
			from: `"SBL" <${envConfig.EMAIL_USER}>`, // sender address
			to, // list of receivers
			subject, // Subject line
			text, // plain text body
			html, // html body
		});

		logger.info("Message sent: %s", info.messageId);
		return info;
	} catch (error) {
		logger.error("Failed to send email", {
			to,
			subject,
			error: getErrorMeta(error),
		});

		throw error;
	}
};

/**
 * 	- send registration email to the user after successful registration
 * 	 @param {String} userEmail
 * 	 @param {String} name
 */
async function sendRegisreationEmail(userEmail, name) {
	const subject = "Welcome to Smart Bachelor Life - Your account is ready";
	const text = `Dear ${name},\n\nWelcome to Smart Bachelor Life. Your account has been created successfully.\n\nWith Smart Bachelor Life, you can organize daily living, track expenses, and stay on top of shared responsibilities with ease.\n\nIf you did not create this account, please ignore this email.\n\nBest regards,\nSmart Bachelor Life Support Team`;
	const html = `
		<div style="margin:0;padding:28px 14px;background:#eef3ff;font-family:'Segoe UI',Tahoma,Arial,sans-serif;color:#0f172a;">
			<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:680px;margin:0 auto;">
				<tr>
					<td>
						<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:linear-gradient(135deg,#0f766e 0%,#0ea5e9 100%);border-radius:18px 18px 0 0;">
							<tr>
								<td style="padding:28px 28px 20px;">
									<p style="margin:0 0 8px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#ccfbf1;">&#10024; Account Activated</p>
									<h1 style="margin:0;font-size:30px;line-height:1.2;color:#ffffff;font-weight:700;">Welcome to Smart Bachelor Life &#127881;</h1>
									<p style="margin:12px 0 0;font-size:15px;line-height:1.6;color:#e0f2fe;">A smarter way to manage your daily life, shared costs, and household tasks.</p>
								</td>
							</tr>
						</table>
					</td>
				</tr>
				<tr>
					<td>
						<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#ffffff;border:1px solid #dbe4ff;border-top:none;border-radius:0 0 18px 18px;overflow:hidden;">
							<tr>
								<td style="padding:28px;">
									<p style="margin:0 0 14px;font-size:17px;line-height:1.6;color:#1e293b;">Hi ${name},</p>
									<p style="margin:0 0 14px;font-size:16px;line-height:1.7;color:#334155;">Your Smart Bachelor Life account is ready. You can now organize daily routines, track expenses, and coordinate with your group in one clean workflow.</p>
									<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:18px 0 20px;">
										<tr>
											<td style="padding:0 8px 8px 0;">
												<span style="display:inline-block;background:#ecfeff;color:#0f766e;border:1px solid #99f6e4;padding:8px 12px;border-radius:999px;font-size:13px;font-weight:600;">&#128176; Expense Tracking</span>
											</td>
											<td style="padding:0 8px 8px 0;">
												<span style="display:inline-block;background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;padding:8px 12px;border-radius:999px;font-size:13px;font-weight:600;">&#127869; Meal Planning</span>
											</td>
											<td style="padding:0 0 8px 0;">
												<span style="display:inline-block;background:#f0fdf4;color:#166534;border:1px solid #bbf7d0;padding:8px 12px;border-radius:999px;font-size:13px;font-weight:600;">&#9989; Task Coordination</span>
											</td>
										</tr>
									</table>
									<table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:4px auto 20px;">
										<tr>
											<td style="border-radius:10px;background:#0f766e;">
												<a href="https://smart-bachelor-life.web.app/dashboard" style="display:inline-block;padding:12px 20px;font-size:15px;font-weight:700;line-height:1;color:#ffffff;text-decoration:none;">Open Dashboard</a>
											</td>
										</tr>
									</table>
									<p style="margin:0 0 10px;font-size:14px;line-height:1.7;color:#64748b;">&#128274; If you did not create this account, you can safely ignore this message.</p>
									<p style="margin:18px 0 0;font-size:15px;line-height:1.7;color:#334155;">Best regards,<br><strong>Smart Bachelor Life Support Team</strong></p>
								</td>
							</tr>
						</table>
					</td>
				</tr>
			</table>
		</div>
	`;

	await sendEmail(userEmail, subject, text, html);
}

async function sendJoinCodeEmail(userEmail, name, groupTitle, joinCode) {
	const subject = `Invitation to join ${groupTitle} on Smart Bachelor Life`;
	const text = `Dear ${name},\n\nYou have been invited to join the group "${groupTitle}" on Smart Bachelor Life. Use the following join code to access the group:\n\nJoin Code: ${joinCode}\n\nWith Smart Bachelor Life, you can organize daily living, track expenses, and stay on top of shared responsibilities with ease.\n\nIf you did not expect this invitation, please ignore this email.\n\nBest regards,\nSmart Bachelor Life Support Team`;
	const html = `
		<div style="margin:0;padding:28px 14px;background:#eef3ff;font-family:'Segoe UI',Tahoma,Arial,sans-serif;color:#0f172a;">
			<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:680px;margin:0 auto;">
				<tr>
					<td>
						<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:linear-gradient(135deg,#1d4ed8 0%,#0ea5e9 100%);border-radius:18px 18px 0 0;">
							<tr>
								<td style="padding:28px 28px 20px;">
									<p style="margin:0 0 8px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#dbeafe;">Group Invitation</p>
									<h1 style="margin:0;font-size:30px;line-height:1.2;color:#ffffff;font-weight:700;">You are invited to join ${groupTitle}</h1>
									<p style="margin:12px 0 0;font-size:15px;line-height:1.6;color:#e0f2fe;">Join your group and start managing shared tasks, meals, and expenses together.</p>
								</td>
							</tr>
						</table>
					</td>
				</tr>
				<tr>
					<td>
						<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#ffffff;border:1px solid #dbe4ff;border-top:none;border-radius:0 0 18px 18px;overflow:hidden;">
							<tr>
								<td style="padding:28px;">
									<p style="margin:0 0 14px;font-size:17px;line-height:1.6;color:#1e293b;">Hi ${name},</p>
									<p style="margin:0 0 14px;font-size:16px;line-height:1.7;color:#334155;">You were invited to join the group <strong>${groupTitle}</strong> on Smart Bachelor Life. Use the join code below to enter the group.</p>
									<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:16px 0 20px;">
										<tr>
											<td style="background:#f8fafc;border:1px dashed #94a3b8;border-radius:12px;padding:18px;text-align:center;">
												<p style="margin:0 0 8px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#64748b;">Join Code</p>
												<p style="margin:0;font-size:30px;line-height:1.2;font-weight:800;letter-spacing:3px;color:#0f172a;">${joinCode}</p>
											</td>
										</tr>
									</table>
									<table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:4px auto 20px;">
										<tr>
											<td style="border-radius:10px;background:#1d4ed8;">
												<a href="https://smart-bachelor-life.web.app/dashboard" style="display:inline-block;padding:12px 20px;font-size:15px;font-weight:700;line-height:1;color:#ffffff;text-decoration:none;">Open Dashboard</a>
											</td>
										</tr>
									</table>
									<p style="margin:0 0 10px;font-size:14px;line-height:1.7;color:#64748b;">If you did not expect this invitation, you can safely ignore this email.</p>
									<p style="margin:18px 0 0;font-size:15px;line-height:1.7;color:#334155;">Best regards,<br><strong>Smart Bachelor Life Support Team</strong></p>
								</td>
							</tr>
						</table>
					</td>
				</tr>
			</table>
		</div>
	`;

	await sendEmail(userEmail, subject, text, html);
}

async function sendUserRemovalEmail(userEmail, name, groupTitle) {
	const subject = `You have been removed from ${groupTitle} on Smart Bachelor Life`;
	const text = `Dear ${name},\n\nYou have been removed from the group "${groupTitle}" on Smart Bachelor Life. If you believe this was a mistake or have any questions, please contact your group manager.\n\nBest regards,\nSmart Bachelor Life Support Team`;
	const html = `
		<div style="margin:0;padding:28px 14px;background:#fff4f4;font-family:'Segoe UI',Tahoma,Arial,sans-serif;color:#0f172a;">
			<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:680px;margin:0 auto;">
				<tr>
					<td>
						<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:linear-gradient(135deg,#b91c1c 0%,#ef4444 100%);border-radius:18px 18px 0 0;">
							<tr>
								<td style="padding:28px 28px 20px;">
									<p style="margin:0 0 8px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#fee2e2;">Membership Update</p>
									<h1 style="margin:0;font-size:28px;line-height:1.2;color:#ffffff;font-weight:700;">You were removed from ${groupTitle}</h1>
									<p style="margin:12px 0 0;font-size:15px;line-height:1.6;color:#ffe4e6;">This notification confirms that your access to this group has been removed.</p>
								</td>
							</tr>
						</table>
					</td>
				</tr>
				<tr>
					<td>
						<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#ffffff;border:1px solid #fecaca;border-top:none;border-radius:0 0 18px 18px;overflow:hidden;">
							<tr>
								<td style="padding:28px;">
									<p style="margin:0 0 14px;font-size:17px;line-height:1.6;color:#1e293b;">Hi ${name},</p>
									<p style="margin:0 0 14px;font-size:16px;line-height:1.7;color:#334155;">You have been removed from the group <strong>${groupTitle}</strong> on Smart Bachelor Life.</p>
									<p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:#475569;">If you believe this was a mistake or need more information, please contact your group manager.</p>
									<table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:6px auto 20px;">
										<tr>
											<td style="border-radius:10px;background:#0f766e;">
												<a href="https://smart-bachelor-life.web.app/dashboard" style="display:inline-block;padding:12px 20px;font-size:15px;font-weight:700;line-height:1;color:#ffffff;text-decoration:none;">Go to Dashboard</a>
											</td>
										</tr>
									</table>
									<p style="margin:0;font-size:14px;line-height:1.7;color:#64748b;">Best regards,<br><strong>Smart Bachelor Life Support Team</strong></p>
								</td>
							</tr>
						</table>
					</td>
				</tr>
			</table>
		</div>
	`;

	await sendEmail(userEmail, subject, text, html);
}

async function sendRoleTransferEmail(
	userEmail,
	name,
	groupTitle,
	isNewManager,
) {
	const subject = isNewManager
		? `You are now manager of ${groupTitle}`
		: `Your manager role changed in ${groupTitle}`;

	const text = isNewManager
		? `Dear ${name},\n\nYou have been promoted to manager of the group "${groupTitle}" on Smart Bachelor Life.\n\nBest regards,\nSmart Bachelor Life Support Team`
		: `Dear ${name},\n\nYour role in the group "${groupTitle}" has been changed from manager to user on Smart Bachelor Life.\n\nBest regards,\nSmart Bachelor Life Support Team`;

	const html = isNewManager
		? `
			<div style="margin:0;padding:28px 14px;background:#effcf6;font-family:'Segoe UI',Tahoma,Arial,sans-serif;color:#0f172a;">
				<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #bbf7d0;border-radius:16px;overflow:hidden;">
					<tr>
						<td style="padding:24px;background:linear-gradient(135deg,#047857 0%,#10b981 100%);color:#ffffff;">
							<h1 style="margin:0;font-size:26px;line-height:1.2;">Manager Role Assigned</h1>
						</td>
					</tr>
					<tr>
						<td style="padding:24px;">
							<p style="margin:0 0 12px;font-size:16px;color:#1e293b;">Hi ${name},</p>
							<p style="margin:0 0 10px;font-size:15px;line-height:1.7;color:#334155;">You are now the manager of <strong>${groupTitle}</strong> on Smart Bachelor Life.</p>
							<p style="margin:0;font-size:14px;color:#64748b;">Best regards,<br><strong>Smart Bachelor Life Support Team</strong></p>
						</td>
					</tr>
				</table>
			</div>
		`
		: `
			<div style="margin:0;padding:28px 14px;background:#fff7ed;font-family:'Segoe UI',Tahoma,Arial,sans-serif;color:#0f172a;">
				<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #fed7aa;border-radius:16px;overflow:hidden;">
					<tr>
						<td style="padding:24px;background:linear-gradient(135deg,#b45309 0%,#f59e0b 100%);color:#ffffff;">
							<h1 style="margin:0;font-size:26px;line-height:1.2;">Role Updated</h1>
						</td>
					</tr>
					<tr>
						<td style="padding:24px;">
							<p style="margin:0 0 12px;font-size:16px;color:#1e293b;">Hi ${name},</p>
							<p style="margin:0 0 10px;font-size:15px;line-height:1.7;color:#334155;">Your role in <strong>${groupTitle}</strong> has been changed from manager to user.</p>
							<p style="margin:0;font-size:14px;color:#64748b;">Best regards,<br><strong>Smart Bachelor Life Support Team</strong></p>
						</td>
					</tr>
				</table>
			</div>
		`;

	await sendEmail(userEmail, subject, text, html);
}

module.exports = {
	sendRegisreationEmail,
	sendJoinCodeEmail,
	sendUserRemovalEmail,
	sendRoleTransferEmail,
};
