const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const port = process.env.PORT || 3000;
const serverUrl = process.env.SWAGGER_SERVER_URL || `http://localhost:${port}`;

const options = {
	definition: {
		openapi: "3.0.3",
		info: {
			title: "Smart Bachelor Life API",
			version: "1.0.0",
			description:
				"Production-grade API documentation for Smart Bachelor Life server.",
		},
		servers: [
			{
				url: serverUrl,
				description: "Default server",
			},
		],
		components: {
			securitySchemes: {
				bearerAuth: {
					type: "http",
					scheme: "bearer",
					bearerFormat: "JWT",
					description: "Firebase ID token in Authorization header",
				},
			},
			schemas: {
				ApiError: {
					type: "object",
					properties: {
						success: { type: "boolean", example: false },
						message: { type: "string", example: "Something went wrong" },
					},
					required: ["success", "message"],
				},
				User: {
					type: "object",
					properties: {
						_id: { type: "string", example: "67f2de9f4e4d9c7ad9a9a111" },
						firebaseUid: { type: "string", example: "firebase_uid_123" },
						email: { type: "string", format: "email", example: "user@example.com" },
						displayName: { type: "string", example: "John Doe" },
						photoURL: { type: "string", example: "https://example.com/avatar.png" },
						role: { type: "string", enum: ["MANAGER", "USER"], example: "USER" },
						provider: { type: "string", example: "GOOGLE" },
						emailVerified: { type: "boolean", example: true },
						lastLoginAt: { type: "string", format: "date-time" },
						createdAt: { type: "string", format: "date-time" },
						updatedAt: { type: "string", format: "date-time" },
					},
				},
				Group: {
					type: "object",
					properties: {
						_id: { type: "string", example: "67f2de9f4e4d9c7ad9a9a222" },
						title: { type: "string", example: "Maple Street Flat" },
						address: { type: "string", example: "12 Maple Street" },
						managerID: { type: "string", example: "67f2de9f4e4d9c7ad9a9a111" },
						userIDs: {
							type: "array",
							items: { type: "string", example: "67f2de9f4e4d9c7ad9a9a333" },
						},
						joinCode: { type: "string", example: "ABC12" },
						createdAt: { type: "string", format: "date-time" },
						updatedAt: { type: "string", format: "date-time" },
					},
				},
				Expense: {
					type: "object",
					properties: {
						_id: { type: "string", example: "67f2de9f4e4d9c7ad9a9a444" },
						groupID: { type: "string", example: "67f2de9f4e4d9c7ad9a9a222" },
						userID: { type: "string", example: "67f2de9f4e4d9c7ad9a9a111" },
						title: { type: "string", example: "Monthly groceries" },
						amount: { type: "number", example: 4500 },
						category: { type: "string", example: "GROCERY" },
						documentURL: {
							type: "string",
							example: "https://ik.imagekit.io/.../expenses_GROCERY_file.jpg",
						},
						createdAt: { type: "string", format: "date-time" },
						updatedAt: { type: "string", format: "date-time" },
					},
				},
				AuthRegisterRequest: {
					type: "object",
					properties: {
						firebaseUid: { type: "string" },
						email: { type: "string", format: "email" },
						displayName: { type: "string" },
						photoURL: { type: "string" },
						provider: { type: "string" },
						lastLoginAt: { type: "string", format: "date-time" },
					},
					required: ["firebaseUid", "email"],
				},
				ManagerRegisterRequest: {
					type: "object",
					properties: {
						email: { type: "string", format: "email" },
					},
					required: ["email"],
				},
				CreateGroupRequest: {
					type: "object",
					properties: {
						title: { type: "string" },
						address: { type: "string" },
					},
					required: ["title", "address"],
				},
				SendJoinCodeRequest: {
					type: "object",
					properties: {
						userList: {
							type: "array",
							items: { type: "string", format: "email" },
						},
					},
					required: ["userList"],
				},
				JoinGroupRequest: {
					type: "object",
					properties: {
						joinCode: { type: "string", example: "ABC12" },
					},
					required: ["joinCode"],
				},
				RemoveUserRequest: {
					type: "object",
					properties: {
						email: { type: "string", format: "email" },
					},
					required: ["email"],
				},
				ChangeRoleRequest: {
					type: "object",
					properties: {
						userId: { type: "string" },
					},
					required: ["userId"],
				},
				CreateExpenseMultipartRequest: {
					type: "object",
					properties: {
						title: { type: "string" },
						amount: { type: "number" },
						category: { type: "string" },
						file: {
							type: "string",
							format: "binary",
							description: "Expense receipt image/file",
						},
					},
					required: ["title", "amount", "category", "file"],
				},
			},
		},
		tags: [
			{ name: "Health", description: "Service health check" },
			{ name: "Auth", description: "Authentication and user lifecycle" },
			{ name: "Group", description: "Group management" },
			{ name: "Expenses", description: "Group expense management" },
		],
		paths: {
			"/health": {
				get: {
					tags: ["Health"],
					summary: "Health check",
					responses: {
						200: {
							description: "API is healthy",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: { type: "boolean", example: true },
											message: { type: "string", example: "OK" },
										},
									},
								},
							},
						},
					},
				},
			},
			"/api/auth/register": {
				post: {
					tags: ["Auth"],
					summary: "Register user",
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/AuthRegisterRequest" },
							},
						},
					},
					responses: {
						201: {
							description: "User registered",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: { type: "boolean", example: true },
											message: { type: "string" },
											user: { $ref: "#/components/schemas/User" },
										},
									},
								},
							},
						},
						400: {
							description: "Invalid payload",
							content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
						},
						422: {
							description: "User already exists",
							content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
						},
						500: {
							description: "Server error",
							content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
						},
					},
				},
			},
			"/api/auth/manager-register": {
				post: {
					tags: ["Auth"],
					summary: "Promote existing user to manager",
					security: [{ bearerAuth: [] }],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/ManagerRegisterRequest" },
							},
						},
					},
					responses: {
						200: {
							description: "User promoted to manager",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: { type: "boolean", example: true },
											message: { type: "string" },
											user: { $ref: "#/components/schemas/User" },
										},
									},
								},
							},
						},
						401: {
							description: "Unauthorized",
							content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
						},
						403: {
							description: "Forbidden",
							content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
						},
						404: {
							description: "User not found",
							content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
						},
						500: {
							description: "Server error",
							content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
						},
					},
				},
			},
			"/api/auth/login": {
				post: {
					tags: ["Auth"],
					summary: "Login user using Firebase token",
					security: [{ bearerAuth: [] }],
					responses: {
						200: {
							description: "User logged in",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: { type: "boolean", example: true },
											message: { type: "string" },
											user: { $ref: "#/components/schemas/User" },
										},
									},
								},
							},
						},
						400: {
							description: "Missing email in token",
							content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
						},
						401: {
							description: "Unauthorized",
							content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
						},
						404: {
							description: "User not found",
							content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
						},
						500: {
							description: "Server error",
							content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
						},
					},
				},
			},
			"/api/auth/logout": {
				post: {
					tags: ["Auth"],
					summary: "Logout user and blacklist token",
					security: [{ bearerAuth: [] }],
					responses: {
						200: {
							description: "Logged out",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: { type: "boolean", example: true },
											message: { type: "string", example: "User logged out successfully" },
										},
									},
								},
							},
						},
						400: {
							description: "Already logged out or missing token",
							content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
						},
						401: {
							description: "Unauthorized",
							content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
						},
						500: {
							description: "Server error",
							content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
						},
					},
				},
			},
			"/api/group": {
				post: {
					tags: ["Group"],
					summary: "Create new group (manager only)",
					security: [{ bearerAuth: [] }],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/CreateGroupRequest" },
							},
						},
					},
					responses: {
						201: {
							description: "Group created",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: { type: "boolean", example: true },
											message: { type: "string" },
											group: { $ref: "#/components/schemas/Group" },
										},
									},
								},
							},
						},
						400: {
							description: "Invalid payload",
							content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
						},
						401: {
							description: "Unauthorized",
							content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
						},
						403: {
							description: "Forbidden",
							content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
						},
						500: {
							description: "Server error",
							content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
						},
					},
				},
			},
			"/api/group/send-join-code": {
				post: {
					tags: ["Group"],
					summary: "Send join code invitations",
					security: [{ bearerAuth: [] }],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/SendJoinCodeRequest" },
							},
						},
					},
					responses: {
						200: {
							description: "Join codes processed",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: { type: "boolean", example: true },
											message: { type: "string" },
											invalidEmails: {
												type: "array",
												items: { type: "string", format: "email" },
											},
										},
									},
								},
							},
						},
						400: {
							description: "Invalid payload",
							content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
						},
						401: {
							description: "Unauthorized",
							content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
						},
						403: {
							description: "Forbidden",
							content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
						},
						500: {
							description: "Server error",
							content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
						},
					},
				},
			},
			"/api/group/join": {
				post: {
					tags: ["Group"],
					summary: "Join group with join code",
					security: [{ bearerAuth: [] }],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/JoinGroupRequest" },
							},
						},
					},
					responses: {
						200: {
							description: "Joined group successfully",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: { type: "boolean", example: true },
											message: { type: "string" },
											group: { $ref: "#/components/schemas/Group" },
										},
									},
								},
							},
						},
						400: {
							description: "Invalid request",
							content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
						},
						401: {
							description: "Unauthorized",
							content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
						},
						403: {
							description: "Not invited",
							content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
						},
						404: {
							description: "Invalid/expired join code",
							content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
						},
						500: {
							description: "Server error",
							content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
						},
					},
				},
			},
			"/api/group/remove-user": {
				post: {
					tags: ["Group"],
					summary: "Remove user from group",
					security: [{ bearerAuth: [] }],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/RemoveUserRequest" },
							},
						},
					},
					responses: {
						200: {
							description: "User removed",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: { type: "boolean", example: true },
											message: { type: "string" },
											group: { $ref: "#/components/schemas/Group" },
										},
									},
								},
							},
						},
						400: {
							description: "Invalid request",
							content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
						},
						401: {
							description: "Unauthorized",
							content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
						},
						403: {
							description: "Forbidden",
							content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
						},
						404: {
							description: "User not found",
							content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
						},
						500: {
							description: "Server error",
							content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
						},
					},
				},
			},
			"/api/group/details": {
				get: {
					tags: ["Group"],
					summary: "Get manager group details",
					security: [{ bearerAuth: [] }],
					responses: {
						200: {
							description: "Group details returned",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: { type: "boolean", example: true },
											message: { type: "string" },
											group: { $ref: "#/components/schemas/Group" },
										},
									},
								},
							},
						},
						401: {
							description: "Unauthorized",
							content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
						},
						403: {
							description: "Forbidden",
							content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
						},
						404: {
							description: "Group not found",
							content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
						},
						500: {
							description: "Server error",
							content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
						},
					},
				},
			},
			"/api/group/details/{groupId}": {
				get: {
					tags: ["Group"],
					summary: "Get member view of group details",
					security: [{ bearerAuth: [] }],
					parameters: [
						{
							name: "groupId",
							in: "path",
							required: true,
							schema: { type: "string" },
						},
					],
					responses: {
						200: {
							description: "Group details returned",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: { type: "boolean", example: true },
											message: { type: "string" },
											groupTitle: { type: "string" },
											groupAddress: { type: "string" },
											manager: { $ref: "#/components/schemas/User" },
										},
									},
								},
							},
						},
						401: {
							description: "Unauthorized",
							content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
						},
						404: {
							description: "Group not found or not a member",
							content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
						},
						500: {
							description: "Server error",
							content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
						},
					},
				},
			},
			"/api/group/change-role": {
				post: {
					tags: ["Group"],
					summary: "Transfer manager role to a member",
					security: [{ bearerAuth: [] }],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/ChangeRoleRequest" },
							},
						},
					},
					responses: {
						200: {
							description: "Role transferred",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: { type: "boolean", example: true },
											message: { type: "string" },
											newManager: { $ref: "#/components/schemas/User" },
										},
									},
								},
							},
						},
						400: {
							description: "Invalid request",
							content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
						},
						401: {
							description: "Unauthorized",
							content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
						},
						403: {
							description: "Forbidden",
							content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
						},
						500: {
							description: "Server error",
							content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
						},
					},
				},
			},
			"/api/expenses": {
				post: {
					tags: ["Expenses"],
					summary: "Create expense with receipt upload",
					security: [{ bearerAuth: [] }],
					requestBody: {
						required: true,
						content: {
							"multipart/form-data": {
								schema: {
									$ref: "#/components/schemas/CreateExpenseMultipartRequest",
								},
							},
						},
					},
					responses: {
						201: {
							description: "Expense created",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: { type: "boolean", example: true },
											message: { type: "string" },
											expense: { $ref: "#/components/schemas/Expense" },
										},
									},
								},
							},
						},
						400: {
							description: "Invalid payload",
							content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
						},
						401: {
							description: "Unauthorized",
							content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
						},
						403: {
							description: "Forbidden",
							content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
						},
						500: {
							description: "Server error",
							content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
						},
					},
				},
				get: {
					tags: ["Expenses"],
					summary: "List expenses for current user group",
					security: [{ bearerAuth: [] }],
					parameters: [
						{
							name: "dateFrom",
							in: "query",
							required: false,
							schema: { type: "string", format: "date" },
							description: "Start date (YYYY-MM-DD)",
						},
						{
							name: "dateTo",
							in: "query",
							required: false,
							schema: { type: "string", format: "date" },
							description: "End date (YYYY-MM-DD)",
						},
					],
					responses: {
						200: {
							description: "Expenses retrieved",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: { type: "boolean", example: true },
											message: { type: "string" },
											expenses: {
												type: "array",
												items: { $ref: "#/components/schemas/Expense" },
											},
										},
									},
								},
							},
						},
						400: {
							description: "Invalid query params",
							content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
						},
						401: {
							description: "Unauthorized",
							content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
						},
						403: {
							description: "Forbidden",
							content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
						},
						500: {
							description: "Server error",
							content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
						},
					},
				},
			},
		},
	},
	apis: [],
};

const swaggerSpec = swaggerJsdoc(options);

const swaggerUiOptions = {
	swaggerOptions: {
		docExpansion: "none",
		persistAuthorization: true,
	},
	customSiteTitle: "Smart Bachelor Life API Docs",
};

module.exports = {
	swaggerUi,
	swaggerSpec,
	swaggerUiOptions,
};
