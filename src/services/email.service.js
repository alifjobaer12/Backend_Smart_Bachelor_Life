const nodemailer = require("nodemailer");

/**
 * - create a transporter object using the Gmail service and OAuth2 authentication
 * - the transporter will be used to send emails from the application
 */
const transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		type: "OAuth2",
		user: process.env.EMAIL_USER,
		clientId: process.env.CLIENT_ID,
		clientSecret: process.env.CLIENT_SECRET,
		refreshToken: process.env.REFRESH_TOKEN,
	},
});

// Verify the connection configuration
transporter.verify((error, success) => {
	if (error) {
		console.error("Error connecting to email server:", error);
	} else {
		console.log("✔️  Email server is ready to send messages");
	}
});

// Function to send email
const sendEmail = async (to, subject, text, html) => {
	try {
		const info = await transporter.sendMail({
			from: `"SBL" <${process.env.EMAIL_USER}>`, // sender address
			to, // list of receivers
			subject, // Subject line
			text, // plain text body
			html, // html body
		});

		console.log("Message sent: %s", info.messageId);
		console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
	} catch (error) {
		console.error("Error sending email:", error);
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

module.exports = {
	sendRegisreationEmail,
};
