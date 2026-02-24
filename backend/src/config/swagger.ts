import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "News API",
            version: "1.0.0",
            description:
                "A production-ready News API with role-based access control, content lifecycle management, and an analytics engine. Built with Node.js + TypeScript for the Eskalate Backend Assessment.",
            contact: { name: "News API Support" },
        },
        servers: [
            {
                url: "http://localhost:3000",
                description: "Local development server",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                    description: "Enter your JWT token (from POST /auth/login) here.",
                },
            },
            schemas: {
                BaseResponse: {
                    type: "object",
                    properties: {
                        Success: { type: "boolean", example: true },
                        Message: { type: "string", example: "Operation successful" },
                        Object: { nullable: true },
                        Errors: { type: "array", items: { type: "string" }, nullable: true },
                    },
                },
                PaginatedResponse: {
                    type: "object",
                    properties: {
                        Success: { type: "boolean", example: true },
                        Message: { type: "string" },
                        Object: { type: "array", items: {} },
                        PageNumber: { type: "integer", example: 1 },
                        PageSize: { type: "integer", example: 10 },
                        TotalSize: { type: "integer", example: 42 },
                        Errors: { nullable: true, example: null },
                    },
                },
                SignupRequest: {
                    type: "object",
                    required: ["name", "email", "password", "role"],
                    properties: {
                        name: {
                            type: "string",
                            example: "Jane Doe",
                            description: "Letters and spaces only",
                        },
                        email: { type: "string", format: "email", example: "jane@example.com" },
                        password: {
                            type: "string",
                            example: "Str0ng!Pass",
                            description:
                                "Min 8 chars, must include uppercase, lowercase, number, and special character",
                        },
                        role: {
                            type: "string",
                            enum: ["author", "reader"],
                            example: "author",
                        },
                    },
                },
                LoginRequest: {
                    type: "object",
                    required: ["email", "password"],
                    properties: {
                        email: { type: "string", format: "email", example: "jane@example.com" },
                        password: { type: "string", example: "Str0ng!Pass" },
                    },
                },
                CreateArticleRequest: {
                    type: "object",
                    required: ["title", "content", "category"],
                    properties: {
                        title: {
                            type: "string",
                            minLength: 1,
                            maxLength: 150,
                            example: "The Future of AI in Healthcare",
                        },
                        content: {
                            type: "string",
                            minLength: 50,
                            example:
                                "Artificial intelligence is transforming healthcare in ways previously unimaginable, enabling faster diagnosis...",
                        },
                        category: {
                            type: "string",
                            example: "Tech",
                            description: 'e.g. "Politics", "Tech", "Sports", "Health"',
                        },
                        status: {
                            type: "string",
                            enum: ["Draft", "Published"],
                            default: "Draft",
                            example: "Draft",
                        },
                    },
                },
                UpdateArticleRequest: {
                    type: "object",
                    properties: {
                        title: { type: "string", maxLength: 150, example: "Updated Title" },
                        content: { type: "string", minLength: 50, example: "Updated content..." },
                        category: { type: "string", example: "Health" },
                        status: { type: "string", enum: ["Draft", "Published"], example: "Published" },
                    },
                },
                Article: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        title: { type: "string" },
                        content: { type: "string" },
                        category: { type: "string" },
                        status: { type: "string", enum: ["Draft", "Published"] },
                        authorId: { type: "string", format: "uuid" },
                        author: {
                            type: "object",
                            properties: {
                                id: { type: "string" },
                                name: { type: "string" },
                                email: { type: "string" },
                            },
                        },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                    },
                },
                DashboardItem: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        title: { type: "string" },
                        status: { type: "string", enum: ["Draft", "Published"] },
                        createdAt: { type: "string", format: "date-time" },
                        totalViews: { type: "integer", example: 1024 },
                    },
                },
                ErrorResponse: {
                    type: "object",
                    properties: {
                        Success: { type: "boolean", example: false },
                        Message: { type: "string", example: "Validation failed" },
                        Object: { nullable: true, example: null },
                        Errors: { type: "array", items: { type: "string" } },
                    },
                },
            },
        },
        paths: {
            // ── Auth ─────────────────────────────────────────────────────────────
            "/auth/signup": {
                post: {
                    tags: ["Auth"],
                    summary: "Register a new user",
                    description:
                        "Create an account as an **author** or **reader**. Password must be strong (8+ chars, uppercase, lowercase, number, special char).",
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/SignupRequest" },
                            },
                        },
                    },
                    responses: {
                        201: {
                            description: "Account created",
                            content: {
                                "application/json": {
                                    schema: { $ref: "#/components/schemas/BaseResponse" },
                                    example: {
                                        Success: true,
                                        Message: "Account created successfully",
                                        Object: {
                                            id: "uuid",
                                            name: "Jane Doe",
                                            email: "jane@example.com",
                                            role: "author",
                                        },
                                        Errors: null,
                                    },
                                },
                            },
                        },
                        409: { description: "Email already in use" },
                        422: { description: "Validation error" },
                    },
                },
            },
            "/auth/login": {
                post: {
                    tags: ["Auth"],
                    summary: "Login and get a JWT token",
                    description: "Authenticate with email + password. Returns a **JWT** valid for 24 hours. Use this token as `Bearer <token>` in the Authorization header.",
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/LoginRequest" },
                            },
                        },
                    },
                    responses: {
                        200: {
                            description: "Login successful",
                            content: {
                                "application/json": {
                                    example: {
                                        Success: true,
                                        Message: "Login successful",
                                        Object: {
                                            token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                                            user: { id: "uuid", name: "Jane Doe", email: "jane@example.com", role: "author" },
                                        },
                                        Errors: null,
                                    },
                                },
                            },
                        },
                        401: { description: "Invalid credentials" },
                        422: { description: "Validation error" },
                    },
                },
            },

            // ── Articles (Public) ─────────────────────────────────────────────────
            "/articles": {
                get: {
                    tags: ["Articles - Public"],
                    summary: "Get published news feed",
                    description:
                        "Returns all **Published** and **not-deleted** articles. Supports filtering and pagination.",
                    parameters: [
                        {
                            name: "category",
                            in: "query",
                            schema: { type: "string" },
                            example: "Tech",
                            description: "Exact category match",
                        },
                        {
                            name: "author",
                            in: "query",
                            schema: { type: "string" },
                            example: "Jane",
                            description: "Partial author name match (case-insensitive)",
                        },
                        {
                            name: "q",
                            in: "query",
                            schema: { type: "string" },
                            example: "AI",
                            description: "Keyword search in title (case-insensitive)",
                        },
                        {
                            name: "page",
                            in: "query",
                            schema: { type: "integer", default: 1 },
                            description: "Page number",
                        },
                        {
                            name: "pageSize",
                            in: "query",
                            schema: { type: "integer", default: 10 },
                            description: "Items per page (max 100)",
                        },
                    ],
                    responses: {
                        200: {
                            description: "Paginated article list",
                            content: {
                                "application/json": {
                                    schema: { $ref: "#/components/schemas/PaginatedResponse" },
                                },
                            },
                        },
                    },
                },
            },
            "/articles/{id}": {
                get: {
                    tags: ["Articles - Public"],
                    summary: "Get a single article (logs read event)",
                    description:
                        "Returns the full article content. **Every successful call creates a ReadLog entry.** If authenticated, the read is attributed to the user; otherwise it's recorded as a guest read.\n\n> Rate limited: **10 requests per minute** per IP + user.",
                    // Swagger will always send the Bearer token if provided.
                    // The API itself still treats missing tokens as guest reads.
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            name: "id",
                            in: "path",
                            required: true,
                            schema: { type: "string", format: "uuid" },
                            description: "Article UUID",
                        },
                    ],
                    responses: {
                        200: {
                            description: "Article retrieved",
                            content: {
                                "application/json": {
                                    schema: { $ref: "#/components/schemas/Article" },
                                },
                            },
                        },
                        404: { description: "Article not found" },
                        410: { description: "Article has been deleted (`News article no longer available`)" },
                        429: { description: "Rate limit exceeded" },
                    },
                },
            },

            // ── Articles (Author) ─────────────────────────────────────────────────
            "/articles/me": {
                get: {
                    tags: ["Articles - Author"],
                    summary: "Get my articles (draft + published)",
                    description:
                        "Returns all articles belonging to the authenticated author, including drafts. Optionally include soft-deleted articles.",
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            name: "page",
                            in: "query",
                            schema: { type: "integer", default: 1 },
                        },
                        {
                            name: "pageSize",
                            in: "query",
                            schema: { type: "integer", default: 10 },
                        },
                        {
                            name: "includeDeleted",
                            in: "query",
                            schema: { type: "string", enum: ["true", "false"], default: "false" },
                            description: "Set to `true` to include soft-deleted articles",
                        },
                    ],
                    responses: {
                        200: { description: "Paginated list of author's articles" },
                        401: { description: "Unauthorized" },
                        403: { description: "Forbidden — authors only" },
                    },
                },
            },
            "/articles/": {
                post: {
                    tags: ["Articles - Author"],
                    summary: "Create a new article",
                    description: "Creates a new article. Defaults status to **Draft**. Only authors can create articles.",
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/CreateArticleRequest" },
                            },
                        },
                    },
                    responses: {
                        201: { description: "Article created" },
                        401: { description: "Unauthorized" },
                        403: { description: "Forbidden — authors only" },
                        422: { description: "Validation error (title/content length, etc.)" },
                    },
                },
            },
            "/articles/{id}/": {
                put: {
                    tags: ["Articles - Author"],
                    summary: "Update an article",
                    description:
                        "Update your own article's title, content, category, or status. Returns 403 if the article belongs to another author.",
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            name: "id",
                            in: "path",
                            required: true,
                            schema: { type: "string", format: "uuid" },
                        },
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/UpdateArticleRequest" },
                            },
                        },
                    },
                    responses: {
                        200: { description: "Article updated" },
                        403: { description: "Forbidden — not your article" },
                        404: { description: "Article not found" },
                    },
                },
                delete: {
                    tags: ["Articles - Author"],
                    summary: "Soft-delete an article",
                    description:
                        "Sets the article's `deletedAt` timestamp. The row is **not removed** from the database. Deleted articles are hidden from the public feed.",
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            name: "id",
                            in: "path",
                            required: true,
                            schema: { type: "string", format: "uuid" },
                        },
                    ],
                    responses: {
                        200: { description: "Article soft-deleted" },
                        403: { description: "Forbidden — not your article" },
                        404: { description: "Article not found" },
                    },
                },
            },

            // ── Author Dashboard ──────────────────────────────────────────────────
            "/author/dashboard": {
                get: {
                    tags: ["Author Analytics"],
                    summary: "Author performance dashboard",
                    description:
                        "Returns a paginated list of the author's articles (excluding soft-deleted) with **TotalViews** summed from the `DailyAnalytics` table.",
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            name: "page",
                            in: "query",
                            schema: { type: "integer", default: 1 },
                        },
                        {
                            name: "pageSize",
                            in: "query",
                            schema: { type: "integer", default: 10 },
                        },
                    ],
                    responses: {
                        200: {
                            description: "Dashboard data",
                            content: {
                                "application/json": {
                                    example: {
                                        Success: true,
                                        Message: "Dashboard data retrieved",
                                        Object: [
                                            {
                                                id: "uuid",
                                                title: "AI in Healthcare",
                                                status: "Published",
                                                createdAt: "2024-01-15T10:00:00.000Z",
                                                totalViews: 1024,
                                            },
                                        ],
                                        PageNumber: 1,
                                        PageSize: 10,
                                        TotalSize: 1,
                                        Errors: null,
                                    },
                                },
                            },
                        },
                        401: { description: "Unauthorized" },
                        403: { description: "Forbidden — authors only" },
                    },
                },
            },

            // ── Health ────────────────────────────────────────────────────────────
            "/health": {
                get: {
                    tags: ["System"],
                    summary: "Health check",
                    responses: {
                        200: { description: "Server is running" },
                    },
                },
            },
        },
    },
    apis: [], // All specs are defined inline above
};

export const swaggerSpec = swaggerJsdoc(options);
