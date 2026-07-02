# Smart Car Driver Booking Platform - Technical Documentation Report

Generated on: 2026-07-01

Scope: This report documents the current repository state for the Smart Car Driver Booking Platform. Source and configuration files were inspected. Generated artifacts such as `node_modules`, `.git`, and the Next.js `.next` cache are treated as build output rather than application architecture. Secret values from `.env` are intentionally not included.

---

# 1. Project Overview

## Purpose

Smart Car Driver Booking Platform is intended to be a full-stack booking system for customers who need either:

- A driver only.
- A car with driver.

The implemented backend currently supports:

- User registration.
- User login.
- JWT generation and verification.
- Protected booking CRUD endpoints.
- MongoDB connection through Mongoose.
- A basic health check endpoint.

The frontend currently exists as a default Next.js starter app and is not yet integrated with the backend API.

## Tech Stack

Backend:

- Node.js
- Express.js 5
- MongoDB
- Mongoose
- CommonJS modules
- JSON Web Tokens with `jsonwebtoken`
- Password hashing with `bcryptjs`
- Data validation with Mongoose and `validator`
- Security middleware with `helmet`
- Request logging with `morgan`
- CORS with `cors`
- Environment loading with `dotenv`

Frontend:

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- ESLint

Installed but not currently implemented in source:

- `cloudinary`
- `multer`
- `nodemailer`
- `socket.io`
- `express-validator`
- `cookie-parser`

## Folder Structure Summary

Repository-level structure:

```text
smart-car-driver-booking-platform/
|-- client/
|-- server/
|-- package.json
|-- README.md
|-- .gitignore
|-- .editorconfig
|-- .prettierrc
`-- .vscode/
```

Important note: the root `package.json`, root `README.md`, `.editorconfig`, `.prettierrc`, and VS Code JSON files are currently empty.

## Architecture Pattern

The backend currently follows a lightweight MVC-style structure:

```text
HTTP Request
  -> app.js global middleware
  -> route file
  -> route-level middleware
  -> controller
  -> Mongoose model
  -> MongoDB
```

Current implementation:

- Routes are in `server/src/routes`.
- Controllers are in `server/src/controllers`.
- Models are in `server/src/models`.
- Middleware is in `server/src/middleware`.
- Utilities are in `server/src/utils`.
- Database config is in `server/src/config/database`.

There is no active service layer yet. `server/src/services` exists but is empty. Controllers currently call Mongoose models directly.

---

# 2. Complete Folder Structure

Complete backend tree excluding `node_modules`:

```text
server/
|-- .env
|-- package-lock.json
|-- package.json
`-- src/
    |-- app.js
    |-- server.js
    |-- config/
    |   `-- database/
    |       |-- connectDB.js
    |       `-- database
    |-- controllers/
    |   |-- admin/
    |   |-- auth/
    |   |-- authController.js
    |   |-- booking/
    |   |-- bookingController.js
    |   |-- car/
    |   |-- driver/
    |   |-- fleet/
    |   |-- invoice/
    |   |-- payment/
    |   `-- user/
    |-- cron/
    |-- middleware/
    |   |-- auth/
    |   |   `-- authMiddleware.js
    |   |-- bookingValidation.js
    |   |-- error/
    |   `-- upload/
    |-- models/
    |   |-- Booking.js
    |   `-- User.js
    |-- routes/
    |   |-- admin/
    |   |-- auth/
    |   |-- authRoutes.js
    |   |-- booking/
    |   |-- bookingRoutes.js
    |   |-- car/
    |   |-- driver/
    |   |-- fleet/
    |   |-- invoice/
    |   |-- payment/
    |   `-- user/
    |-- services/
    |-- sockets/
    |-- uploads/
    |-- utils/
    |   |-- asyncHandler.js
    |   |-- cloudinary/
    |   |-- email/
    |   |-- generateToken.js
    |   |-- helpers/
    |   `-- pdf/
    `-- validators/
```

Empty backend files:

- `server/src/middleware/bookingValidation.js`
- `server/src/config/database/database`

Empty backend directories:

- `server/src/controllers/admin`
- `server/src/controllers/auth`
- `server/src/controllers/booking`
- `server/src/controllers/car`
- `server/src/controllers/driver`
- `server/src/controllers/fleet`
- `server/src/controllers/invoice`
- `server/src/controllers/payment`
- `server/src/controllers/user`
- `server/src/cron`
- `server/src/middleware/error`
- `server/src/middleware/upload`
- `server/src/routes/admin`
- `server/src/routes/auth`
- `server/src/routes/booking`
- `server/src/routes/car`
- `server/src/routes/driver`
- `server/src/routes/fleet`
- `server/src/routes/invoice`
- `server/src/routes/payment`
- `server/src/routes/user`
- `server/src/services`
- `server/src/sockets`
- `server/src/uploads`
- `server/src/utils/cloudinary`
- `server/src/utils/email`
- `server/src/utils/helpers`
- `server/src/utils/pdf`
- `server/src/validators`

---

# 3. Package Information

## Root Package

File: `package.json`

Current state:

- Empty file.
- This is invalid JSON.
- Running Node-based tooling from the repository root can fail with `ERR_INVALID_PACKAGE_CONFIG`.

## Backend Package

File: `server/package.json`

Package:

- Name: `server`
- Version: `1.0.0`
- Type: `commonjs`
- Main: `src/server.js`
- Description: `Smart Car Driver Booking Platform Backend`

Scripts:

```json
{
  "start": "node src/server.js",
  "dev": "nodemon src/server.js",
  "test": "echo \"Error: no test specified\" && exit 1"
}
```

Important backend dependencies:

- `express`: HTTP API framework.
- `mongoose`: MongoDB object modeling.
- `mongodb`: MongoDB driver.
- `dotenv`: environment variable loading.
- `jsonwebtoken`: JWT signing and verification.
- `bcryptjs`: password hashing.
- `validator`: email validation in the User model.
- `cors`: CORS middleware.
- `helmet`: HTTP security headers.
- `morgan`: request logging.
- `express-validator`: installed but not currently used.
- `multer`: installed but not currently used.
- `cloudinary`: installed but not currently used.
- `nodemailer`: installed but not currently used.
- `socket.io`: installed but not currently used.
- `cookie-parser`: installed but not currently used.

Dev dependencies:

- `nodemon`

Package-lock:

- `server/package-lock.json`
- Lockfile version: 3

Observation:

- `server/package.json` contains many low-level packages that are normally transitive dependencies, such as `accepts`, `bytes`, `debug`, `mime-types`, and others. This makes dependency management noisier than necessary.

## Frontend Package

File: `client/package.json`

Package:

- Name: `client`
- Version: `0.1.0`
- Private: `true`

Scripts:

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint"
}
```

Dependencies:

- `next`: `16.2.9`
- `react`: `19.2.4`
- `react-dom`: `19.2.4`

Dev dependencies:

- `typescript`
- `tailwindcss`
- `@tailwindcss/postcss`
- `eslint`
- `eslint-config-next`
- `@types/node`
- `@types/react`
- `@types/react-dom`

Package-lock:

- `client/package-lock.json`
- Lockfile version: 3

## Runtime Versions Observed Locally

- Node.js: `v24.14.0`
- npm: `11.9.0`

No `engines` field is configured in either `server/package.json` or `client/package.json`.

---

# 4. Environment Variables

Environment file inspected:

- `server/.env`

Secret values are not shown.

| Variable | Defined In | Used In | Purpose | Notes |
|---|---|---|---|---|
| `PORT` | `server/.env` | `server/src/server.js` | Server port | Defaults to `5001` when missing. |
| `NODE_ENV` | `server/.env` | Not used in source | Environment mode | Should be used for production behavior, logging, errors, CORS, cookies, etc. |
| `MONGODB_URI` | `server/.env` | `server/src/config/database/connectDB.js` | MongoDB connection string | Required for database connection. |
| `JWT_SECRET` | `server/.env` | `server/src/utils/generateToken.js`, `server/src/middleware/auth/authMiddleware.js` | JWT signing and verification secret | Required. The current line should be reviewed for accidental duplicated key text in the value. |
| `JWT_EXPIRE` | `server/.env` | `server/src/utils/generateToken.js` | JWT token expiration | Defaults to `7d` when missing. |
| `CLIENT_URL` | `server/.env` | Not used in source | Intended frontend origin | Should be used to restrict CORS in production. |

Code-level environment access:

```text
server/src/server.js
|-- process.env.PORT

server/src/config/database/connectDB.js
|-- process.env.MONGODB_URI

server/src/utils/generateToken.js
|-- process.env.JWT_SECRET
|-- process.env.JWT_EXPIRE

server/src/middleware/auth/authMiddleware.js
`-- process.env.JWT_SECRET
```

---

# 5. Database Analysis

Database technology:

- MongoDB
- Mongoose

Implemented Mongoose models:

- `User`
- `Booking`

No models currently exist for:

- `Car`
- `Driver`
- `Payment`
- `Trip`
- `Invoice`
- `Fleet`
- `Admin`

## User Model

File: `server/src/models/User.js`

Model name:

- `User`

Collection name:

- `users`
- Mongoose collection name is inferred automatically.

Schema options:

- `timestamps: true`
- Adds `createdAt` and `updatedAt`.

Fields:

| Field | Type | Required | Default | Enum | Validation / Notes |
|---|---|---:|---|---|---|
| `_id` | ObjectId | Yes | Generated | None | Mongoose default primary key. |
| `name` | String | Yes | None | None | Trimmed, min length 2, max length 50. |
| `email` | String | Yes | None | None | Unique, lowercase, trimmed, validated with `validator.isEmail`. |
| `phone` | String | Yes | None | None | Trimmed. |
| `password` | String | Yes | None | None | Min length 6, `select: false`, hashed before save. |
| `role` | String | No | `customer` | `customer`, `driver`, `admin` | Role is stored and included in JWT. |
| `isVerified` | Boolean | No | `false` | None | No verification flow implemented yet. |
| `status` | String | No | `active` | `active`, `inactive`, `blocked` | No blocking logic implemented yet. |
| `createdAt` | Date | Auto | Auto | None | Added by timestamps. |
| `updatedAt` | Date | Auto | Auto | None | Added by timestamps. |

Indexes:

- `email` has `unique: true`.
- `_id` default index exists.

Relationships:

- No explicit references to other models.
- No current relationship from `User` to `Booking`.

Hooks:

- `pre("save")` hashes the password with bcrypt when the password is modified.

Methods:

- `comparePassword(enteredPassword)` compares a plaintext password with the stored hash.

Validation:

- Name length.
- Email required and format validation.
- Password minimum length.
- Role enum.
- Status enum.

## Booking Model

File: `server/src/models/Booking.js`

Model name:

- `Booking`

Collection name:

- `bookings`
- Mongoose collection name is inferred automatically.

Schema options:

- `timestamps: true`
- Adds `createdAt` and `updatedAt`.

Fields:

| Field | Type | Required | Default | Enum | Validation / Notes |
|---|---|---:|---|---|---|
| `_id` | ObjectId | Yes | Generated | None | Mongoose default primary key. |
| `customerName` | String | Yes | None | None | Trimmed. |
| `mobileNumber` | String | Yes | None | None | Trimmed, must match Indian mobile pattern `^[6-9]\d{9}$`. |
| `serviceType` | String | Yes | None | `Driver Only`, `Car with Driver` | Controls conditional fields in controller logic. |
| `carType` | String | No | None | `AC`, `Non-AC` | Required by controller only when service type is `Car with Driver`. |
| `pickupLocation` | String | Yes | None | None | Trimmed. |
| `dropLocation` | String | Yes | None | None | Trimmed. |
| `bookingDate` | Date | Yes | None | None | No future-date validation implemented. |
| `pickupTime` | String | Yes | None | None | No time format validation implemented. |
| `estimatedHours` | Number | No | None | None | Min 1. Required by controller only for `Driver Only`. |
| `estimatedKm` | Number | No | None | None | Min 1. Required by controller only for `Car with Driver`. |
| `rate` | Number | No | `0` | None | Min 0. Placeholder for future pricing. |
| `totalAmount` | Number | No | `0` | None | Min 0. Placeholder for backend-calculated amount. |
| `paymentMethod` | String | Yes | None | `Cash`, `UPI`, `Card`, `Net Banking` | Required. |
| `paymentStatus` | String | No | `Pending` | `Pending`, `Paid`, `Refunded` | No payment integration implemented. |
| `bookingStatus` | String | No | `Pending` | `Pending`, `Confirmed`, `Ongoing`, `Completed`, `Cancelled` | No status-transition rules implemented. |
| `notes` | String | No | Empty string | None | Trimmed, max length 500. |
| `createdAt` | Date | Auto | Auto | None | Added by timestamps. |
| `updatedAt` | Date | Auto | Auto | None | Added by timestamps. |

Indexes:

- `_id` default index exists.
- No custom indexes.

Relationships:

- No explicit `customer`, `user`, `driver`, `car`, `payment`, or `trip` reference.
- Bookings are protected by JWT at the route level, but created booking documents are not linked to `req.user`.

Validation:

- Mongoose validates required fields, enums, min values, mobile number pattern, and notes length.
- Controller manually validates conditional fields based on `serviceType`.

---

# 6. Schema Diagram

## Current Implemented Relationship Diagram

```text
User
  |
  |  Auth middleware loads User from JWT and assigns req.user
  |
  v
Request Context

Booking
  |
  |  Standalone collection
  |  No userId, carId, driverId, paymentId, or tripId reference
  v
bookings collection
```

Current database relationship status:

- `User` and `Booking` are not connected at the schema level.
- A logged-in user can access protected booking endpoints, but booking ownership is not enforced.
- There is no `Car`, `Driver`, `Payment`, or `Trip` model yet.

## Intended Production Relationship Direction

For a production booking platform, the likely target model is:

```text
User
  |
  |----< Booking
             |
             |---- Car
             |
             |---- Driver
             |
             |---- Payment
             |
             `---- Trip / Ride Lifecycle
```

Recommended future references:

- `Booking.customer` -> `User._id`
- `Booking.driver` -> `Driver._id` or `User._id` with role `driver`
- `Booking.car` -> `Car._id`
- `Booking.payment` -> `Payment._id`
- `Trip.booking` -> `Booking._id`

---

# 7. Controllers

## Auth Controller

File: `server/src/controllers/authController.js`

### `registerUser`

Purpose:

- Register a new customer account.
- Hash password via the User model pre-save hook.
- Generate a JWT after successful registration.

Route used:

- `POST /api/v1/auth/register`

Protected:

- No

Request body:

```json
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "password": "string"
}
```

Business logic:

- Checks that name, email, phone, and password exist.
- Checks if a user already exists with the same email.
- Creates a new user.
- Generates JWT using user id and role.
- Returns token and public user fields.

Responses:

| Status | Meaning | Response |
|---:|---|---|
| 201 | Registration successful | `{ success, message, token, user }` |
| 400 | Missing required fields | `{ success: false, message }` |
| 409 | Email already registered | `{ success: false, message }` |
| 500 | Server error | `{ success: false, message }` |

Notes:

- Controller uses manual `try/catch`.
- Does not use `asyncHandler`.
- Does not validate phone format at controller level.
- Does not verify email.
- Does not block registration by role; role defaults to `customer`.

### `loginUser`

Purpose:

- Authenticate an existing user.
- Compare submitted password with hashed password.
- Generate JWT after successful login.

Route used:

- `POST /api/v1/auth/login`

Protected:

- No

Request body:

```json
{
  "email": "string",
  "password": "string"
}
```

Business logic:

- Checks that email and password exist.
- Finds user by email and explicitly selects password.
- Compares password using `user.comparePassword`.
- Generates JWT using user id and role.
- Returns token and public user fields.

Responses:

| Status | Meaning | Response |
|---:|---|---|
| 200 | Login successful | `{ success, message, token, user }` |
| 400 | Missing email or password | `{ success: false, message }` |
| 401 | Invalid credentials | `{ success: false, message }` |
| 500 | Server error | `{ success: false, message }` |

Notes:

- Does not check `user.status`.
- Does not check `isVerified`.
- Does not implement login rate limiting.
- Does not issue refresh tokens.

## Booking Controller

File: `server/src/controllers/bookingController.js`

All booking controller functions are wrapped in `asyncHandler`.

Important note: comments in this file still say `@access Public` and route paths like `/api/bookings`, but the real routes are mounted at `/api/v1/bookings` and protected by `authMiddleware`.

### `createBooking`

Purpose:

- Create a new booking.

Route used:

- `POST /api/v1/bookings`

Protected:

- Yes, `authMiddleware`

Request body:

```json
{
  "customerName": "string",
  "mobileNumber": "string",
  "serviceType": "Driver Only | Car with Driver",
  "carType": "AC | Non-AC",
  "pickupLocation": "string",
  "dropLocation": "string",
  "bookingDate": "date",
  "pickupTime": "string",
  "estimatedHours": "number",
  "estimatedKm": "number",
  "paymentMethod": "Cash | UPI | Card | Net Banking",
  "notes": "string"
}
```

Business logic:

- Requires `estimatedHours` when `serviceType` is `Driver Only`.
- Requires `carType` and `estimatedKm` when `serviceType` is `Car with Driver`.
- Creates booking with `rate: 0` and `totalAmount: 0`.
- Pricing is not implemented yet.
- Booking is not linked to `req.user`.

Responses:

| Status | Meaning | Response |
|---:|---|---|
| 201 | Booking created | `{ success, message, data }` |
| 400 | Conditional booking field missing | `{ success: false, message }` |
| 401 | No/invalid JWT | Returned by auth middleware |
| 500/default error | Mongoose or runtime error | No custom global error response currently |

### `getAllBookings`

Purpose:

- Fetch all bookings sorted by newest first.

Route used:

- `GET /api/v1/bookings`

Protected:

- Yes, `authMiddleware`

Request body:

- None

Business logic:

- Calls `Booking.find().sort({ createdAt: -1 })`.
- Returns every booking in the database.

Responses:

| Status | Meaning | Response |
|---:|---|---|
| 200 | Success | `{ success, count, data }` |
| 401 | No/invalid JWT | Returned by auth middleware |

Notes:

- No pagination.
- No filtering.
- No role restriction.
- No ownership restriction.

### `getBookingById`

Purpose:

- Fetch one booking by MongoDB ObjectId.

Route used:

- `GET /api/v1/bookings/:id`

Protected:

- Yes, `authMiddleware`

Request body:

- None

Business logic:

- Calls `Booking.findById(req.params.id)`.
- Returns 404 if no booking is found.

Responses:

| Status | Meaning | Response |
|---:|---|---|
| 200 | Success | `{ success, data }` |
| 401 | No/invalid JWT | Returned by auth middleware |
| 404 | Booking not found | `{ success: false, message }` |
| 500/default error | Invalid ObjectId or runtime error | No custom global error response currently |

### `updateBooking`

Purpose:

- Update a booking by MongoDB ObjectId.

Route used:

- `PUT /api/v1/bookings/:id`

Protected:

- Yes, `authMiddleware`

Request body:

- Any fields accepted by the Booking schema.

Business logic:

- Checks if booking exists.
- Calls `Booking.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })`.
- Returns updated document.

Responses:

| Status | Meaning | Response |
|---:|---|---|
| 200 | Updated successfully | `{ success, message, data }` |
| 401 | No/invalid JWT | Returned by auth middleware |
| 404 | Booking not found | `{ success: false, message }` |
| 500/default error | Invalid ObjectId, validation, or runtime error | No custom global error response currently |

Notes:

- No update whitelist.
- No role check.
- No ownership check.
- No status transition validation.
- Pricing fields can be modified if present in `req.body`.

### `deleteBooking`

Purpose:

- Delete a booking by MongoDB ObjectId.

Route used:

- `DELETE /api/v1/bookings/:id`

Protected:

- Yes, `authMiddleware`

Request body:

- None

Business logic:

- Checks if booking exists.
- Calls `booking.deleteOne()`.

Responses:

| Status | Meaning | Response |
|---:|---|---|
| 200 | Deleted successfully | `{ success, message }` |
| 401 | No/invalid JWT | Returned by auth middleware |
| 404 | Booking not found | `{ success: false, message }` |
| 500/default error | Invalid ObjectId or runtime error | No custom global error response currently |

---

# 8. Routes

Base API mounting is defined in `server/src/app.js`.

## Health Route

| Method | Endpoint | Protected | Middleware | Handler |
|---|---|---:|---|---|
| GET | `/api/v1/health` | No | `cors`, `helmet`, `morgan`, JSON parsers | Inline handler in `app.js` |

Response:

```json
{
  "success": true,
  "message": "Smart Car Driver Booking API is running"
}
```

## Auth Routes

File: `server/src/routes/authRoutes.js`

Mounted at:

- `/api/v1/auth`

| Method | Endpoint | Protected | Middleware | Controller |
|---|---|---:|---|---|
| POST | `/api/v1/auth/register` | No | Global middleware only | `registerUser` |
| POST | `/api/v1/auth/login` | No | Global middleware only | `loginUser` |

## Booking Routes

File: `server/src/routes/bookingRoutes.js`

Mounted at:

- `/api/v1/bookings`

| Method | Endpoint | Protected | Middleware | Controller |
|---|---|---:|---|---|
| POST | `/api/v1/bookings` | Yes | `authMiddleware` | `createBooking` |
| GET | `/api/v1/bookings` | Yes | `authMiddleware` | `getAllBookings` |
| GET | `/api/v1/bookings/:id` | Yes | `authMiddleware` | `getBookingById` |
| PUT | `/api/v1/bookings/:id` | Yes | `authMiddleware` | `updateBooking` |
| DELETE | `/api/v1/bookings/:id` | Yes | `authMiddleware` | `deleteBooking` |

---

# 9. Middleware

## Global Express Middleware

Defined in:

- `server/src/app.js`

Middleware stack:

```js
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
```

Purpose:

- `cors`: allows cross-origin requests. Currently unrestricted.
- `helmet`: sets common HTTP security headers.
- `morgan("dev")`: logs HTTP requests during development.
- `express.json()`: parses JSON bodies.
- `express.urlencoded({ extended: true })`: parses URL-encoded bodies.

## Authentication Middleware

File:

- `server/src/middleware/auth/authMiddleware.js`

Purpose:

- Protect routes using JWT authentication.

Behavior:

- Reads `Authorization` header.
- Requires `Bearer <token>` format.
- Verifies token using `process.env.JWT_SECRET`.
- Finds user by decoded `id`.
- Excludes password from selected user.
- Attaches user document to `req.user`.
- Returns 401 for missing, invalid, expired token, or missing user.

Used by:

- Every booking route in `server/src/routes/bookingRoutes.js`.

Limitations:

- Does not check user `status`.
- Does not check `isVerified`.
- Does not enforce role authorization.
- Does not distinguish expired token errors from malformed token errors.

## Authorization Middleware

Current state:

- Not implemented.

Needed for:

- Admin-only routes.
- Driver-only routes.
- Customer booking ownership.
- Driver assignment workflows.

## Validation Middleware

Current state:

- `server/src/middleware/bookingValidation.js` exists but is empty.
- `server/src/validators` directory exists but is empty.
- `express-validator` is installed but not used.

Current validation is handled by:

- Manual checks in `bookingController.createBooking`.
- Mongoose schema validation.
- Manual checks in `authController`.

## Upload Middleware

Current state:

- `server/src/middleware/upload` exists but is empty.
- `multer` is installed but not used.
- `cloudinary` is installed but not used.

## Error Middleware

Current state:

- `server/src/middleware/error` exists but is empty.
- No global Express error handler is mounted.

Impact:

- Errors passed from `asyncHandler` go to Express default error handling.
- Mongoose `CastError`, validation errors, and duplicate key errors are not normalized into consistent JSON API responses.

## Async Handler

File:

- `server/src/utils/asyncHandler.js`

Purpose:

- Wrap async controllers and pass rejected promises to `next`.

Used by:

- Booking controller functions.

Not used by:

- Auth controller functions.

## Role Middleware

Current state:

- Not implemented.

---

# 10. Utilities

## JWT Generator

File:

- `server/src/utils/generateToken.js`

Purpose:

- Generate JWT access tokens.

Payload:

```json
{
  "id": "user id",
  "role": "user role"
}
```

Configuration:

- Secret: `process.env.JWT_SECRET`
- Expiration: `process.env.JWT_EXPIRE || "7d"`

Used by:

- `registerUser`
- `loginUser`

Limitations:

- No refresh token support.
- No token issuer or audience claims.
- No explicit check that `JWT_SECRET` is configured before signing.

## Async Handler

File:

- `server/src/utils/asyncHandler.js`

Purpose:

- Avoid repetitive try/catch in async route handlers.

Used by:

- Booking controller.

## Cloudinary

Current state:

- `server/src/utils/cloudinary` exists as an empty directory.
- `cloudinary` package is installed.
- No Cloudinary utility is implemented.

## Email

Current state:

- `server/src/utils/email` exists as an empty directory.
- `nodemailer` package is installed.
- No email utility is implemented.

## PDF

Current state:

- `server/src/utils/pdf` exists as an empty directory.
- No PDF utility is implemented.

## Helpers

Current state:

- `server/src/utils/helpers` exists as an empty directory.
- No helper utilities are implemented.

## Response Helper

Current state:

- Not implemented.

Responses are manually constructed in controllers.

---

# 11. Services

Directory:

- `server/src/services`

Current state:

- Empty.

There is no service layer yet.

Current business logic location:

- Auth logic is inside `authController.js`.
- Booking validation and CRUD logic are inside `bookingController.js`.
- Token generation is in `utils/generateToken.js`.

Recommended future services:

- `authService`
- `bookingService`
- `pricingService`
- `paymentService`
- `driverAssignmentService`
- `notificationService`
- `emailService`
- `uploadService`
- `invoiceService`

---

# 12. Current Project Progress

## Completed

- Backend Express app setup.
- HTTP server setup.
- MongoDB connection utility.
- User model.
- Booking model.
- User registration.
- User login.
- Password hashing with bcrypt.
- JWT generation.
- JWT authentication middleware.
- Protected booking routes.
- Booking CRUD controller.
- Health check route.
- Basic global middleware: CORS, Helmet, Morgan, JSON parsing.
- Next.js client scaffold.

## Partially Completed

- Authentication: access-token login works, but no refresh token, logout, email verification, forgot password, or account status checks.
- Authorization: role is stored and included in JWT, but no role-based middleware exists.
- Booking domain: basic CRUD exists, but no customer ownership, driver assignment, car assignment, pricing, payment, or lifecycle workflow.
- Validation: Mongoose validation and manual checks exist, but validation middleware is empty.
- Error handling: `asyncHandler` exists, but no global error middleware exists.
- Project structure: many planned module folders exist but are empty.
- Frontend: Next.js app exists, but product UI and API integration are not started.
- Security: Helmet and password hashing exist, but production hardening is incomplete.

## Not Started

- Car module.
- Driver module.
- Payment module.
- Trip lifecycle module.
- Fleet module.
- Invoice module.
- Admin module.
- User profile module.
- Role-based authorization.
- Booking ownership.
- Pricing engine.
- Payment gateway integration.
- File upload.
- Cloudinary integration.
- Email service.
- Notifications.
- Socket.IO real-time updates.
- Cron jobs.
- Tests.
- CI/CD.
- API documentation tooling such as Swagger/OpenAPI.
- Deployment configuration.
- Production logging and monitoring.

## Completion Estimate

Estimated completion for a production-ready full-stack platform:

- Backend API foundation: 30-35%
- Full backend production readiness: 20-25%
- Frontend product experience: 5-10%
- Overall project: approximately 20-25%

---

# 13. Security Analysis

## JWT Implementation

Implemented:

- JWT is generated on register and login.
- JWT contains user id and role.
- JWT expiration is configurable through `JWT_EXPIRE`.
- Protected routes verify token using `JWT_SECRET`.

Missing or recommended:

- Validate that `JWT_SECRET` exists at startup.
- Use a strong production secret outside source control.
- Add refresh token rotation.
- Add logout/token revocation strategy.
- Add token issuer and audience claims.
- Return clearer auth error categories internally while keeping client-safe messages.

## Password Hashing

Implemented:

- Passwords are hashed with `bcryptjs`.
- Salt rounds: 10.
- Password field uses `select: false`.
- Login explicitly selects password for comparison.

Missing or recommended:

- Password complexity requirements.
- Password confirmation on registration.
- Forgot password flow.
- Password reset tokens.
- Password change endpoint.
- Account lockout or login throttling.

## Input Validation

Implemented:

- User model validates email format.
- User model validates password length.
- Booking model validates required fields, enums, phone pattern, minimum numeric values, and notes length.
- Booking controller validates conditional fields for service type.

Missing or recommended:

- Route-level validation with `express-validator`, Zod, Joi, or similar.
- Centralized validation error responses.
- ObjectId validation for `:id` params.
- Future-date validation for booking dates.
- Time format validation for pickup time.
- Request body whitelisting for updates.
- Sanitization against NoSQL operator injection.

## Authorization

Current state:

- Authentication exists.
- Authorization does not exist.

Risk:

- Any authenticated user can access all bookings.
- Any authenticated user can update or delete any booking.
- User roles are not enforced.

Recommended:

- Add `authorizeRoles(...roles)` middleware.
- Add ownership checks for customer routes.
- Restrict admin-only booking listing, updates, deletes, and status changes.

## File Upload Security

Current state:

- Upload system is not implemented.
- `multer` and `cloudinary` are installed but unused.

Recommended when implemented:

- Enforce MIME type checks.
- Enforce file size limits.
- Use server-side generated filenames.
- Scan or validate uploaded files.
- Store files outside application source.
- Use signed Cloudinary upload flows if needed.

## Other Security Observations

Implemented:

- `helmet` is enabled.

Needs improvement:

- CORS is unrestricted.
- No rate limiting.
- No request size limits beyond Express defaults.
- No centralized error handler to avoid leaking implementation details.
- No audit logging.
- No account verification flow.
- No production-safe logging strategy.
- `.env` exists locally; ensure it remains ignored and rotate secrets if ever committed.

---

# 14. Missing Features

Production-ready missing features:

1. Global error handler.
2. Centralized validation middleware.
3. Role-based authorization.
4. Booking ownership enforcement.
5. Refresh token flow.
6. Logout/token revocation.
7. Forgot password.
8. Reset password.
9. Email verification.
10. Account status enforcement.
11. Rate limiting.
12. CORS origin restriction using `CLIENT_URL`.
13. Request sanitization.
14. ObjectId validation middleware.
15. Booking pagination.
16. Booking filtering and searching.
17. Booking status workflow validation.
18. Pricing engine.
19. Car model and car management.
20. Driver model or driver profile management.
21. Driver assignment.
22. Trip lifecycle tracking.
23. Payment model and payment gateway integration.
24. Invoice generation.
25. Email/SMS notifications.
26. Real-time updates with Socket.IO.
27. File upload and Cloudinary integration.
28. Admin dashboard APIs.
29. Customer profile APIs.
30. API documentation with Swagger/OpenAPI.
31. Unit tests.
32. Integration tests.
33. Authentication tests.
34. CI/CD pipeline.
35. Production logging.
36. Monitoring and alerting.
37. Deployment configuration.
38. Docker configuration.
39. Environment validation at startup.
40. Frontend product UI and backend API integration.

---

# 15. Bugs / Code Smells

## Bugs and Runtime Risks

1. Root `package.json` is empty and invalid JSON.
   - Risk: Node tooling launched from the repository root can fail with `ERR_INVALID_PACKAGE_CONFIG`.

2. No global error handler.
   - Risk: async errors from booking controllers are passed to Express default error handling.
   - Mongoose validation errors and invalid ObjectIds are not returned in a consistent JSON format.

3. `JWT_SECRET` environment entry should be reviewed.
   - Risk: the current `.env` line appears to contain duplicated key text in the value.
   - This may not crash the app, but it is likely accidental configuration drift.

4. Bookings are not linked to authenticated users.
   - Risk: protected routes authenticate users but do not enforce ownership.

5. `getAllBookings` returns all bookings to any authenticated user.
   - Risk: privacy and authorization violation.

6. `updateBooking` accepts `req.body` directly.
   - Risk: users may update fields that should be server-controlled, such as payment status, booking status, rate, or total amount.

7. Invalid MongoDB ObjectId values can trigger unhandled Mongoose `CastError`.
   - Risk: inconsistent API errors.

8. Auth controller duplicates try/catch error handling.
   - Risk: inconsistent error style compared with booking controller.

## Unused or Placeholder Files

- `server/src/middleware/bookingValidation.js` is empty.
- `server/src/config/database/database` is empty.
- Many module directories are empty.
- Root `README.md` is empty.
- Root `.editorconfig` is empty.
- Root `.prettierrc` is empty.
- `.vscode/settings.json` is empty.
- `.vscode/extensions.json` is empty.

## Unused Installed Dependencies

Installed but not imported in source:

- `express-validator`
- `multer`
- `cloudinary`
- `nodemailer`
- `socket.io`
- `cookie-parser`
- `body-parser`

## Naming and Structure Inconsistencies

1. Implemented controllers are at:
   - `server/src/controllers/authController.js`
   - `server/src/controllers/bookingController.js`

   But empty modular folders also exist:
   - `server/src/controllers/auth`
   - `server/src/controllers/booking`

2. Implemented routes are at:
   - `server/src/routes/authRoutes.js`
   - `server/src/routes/bookingRoutes.js`

   But empty modular folders also exist:
   - `server/src/routes/auth`
   - `server/src/routes/booking`

3. Booking controller comments are stale:
   - They say routes are `/api/bookings`.
   - Actual mounted routes are `/api/v1/bookings`.
   - They say access is public.
   - Actual routes are protected.

## Performance Issues

- `GET /api/v1/bookings` has no pagination.
- No indexes for common booking queries such as `bookingDate`, `bookingStatus`, `paymentStatus`, or user ownership.
- No lean queries for read-only list endpoints.
- No response caching strategy.

## Security Code Smells

- CORS is open to all origins.
- No rate limiting.
- No role enforcement.
- No ownership checks.
- No request sanitization.
- No update whitelist.
- No startup validation for required environment variables.

---

# 16. Recommended Next Tasks

1. Add a global error handler.
   - This should come first because `asyncHandler` already forwards errors, but no middleware standardizes responses.
   - Handle Mongoose `ValidationError`, `CastError`, duplicate key errors, JWT errors, and generic server errors.

2. Add request validation middleware.
   - Use the already installed `express-validator` or choose a schema validator.
   - Validate auth bodies, booking bodies, and ObjectId params before controllers run.

3. Add booking ownership and role authorization.
   - Add a `customer` or `user` reference to bookings.
   - Enforce that customers can access only their own bookings.
   - Add role middleware for admin and driver workflows.

4. Harden authentication.
   - Validate required env vars on startup.
   - Check user `status` in auth middleware.
   - Add forgot password, reset password, email verification, and refresh token support.

5. Clean dependency and project metadata.
   - Fix the empty root `package.json`.
   - Add root README documentation.
   - Prune direct dependencies that should be transitive.
   - Add `engines` to backend and frontend packages.

6. Build production booking workflow.
   - Add pricing calculation.
   - Add booking status transition rules.
   - Add driver assignment.
   - Add car assignment.
   - Add payment status rules.

7. Add missing domain models.
   - Add `Car`, `Driver`, `Payment`, `Trip`, and `Invoice` models as needed.
   - Define references and indexes before expanding controllers.

8. Add tests.
   - Start with auth and booking route integration tests.
   - Add model validation tests.
   - Add authorization tests once ownership is implemented.

9. Build frontend product flows.
   - Replace default Next.js starter screen.
   - Add login/register pages.
   - Add booking creation and booking list pages.
   - Add authenticated API client.

10. Add deployment and operations readiness.
    - Add production logging.
    - Add rate limiting.
    - Add CORS restrictions.
    - Add Docker or deployment docs.
    - Add CI/CD.

---

# 17. Overall Code Quality

Scores are based on the current implementation state, not the project idea.

| Category | Score | Reason |
|---|---:|---|
| Architecture | 5/10 | Basic MVC layout exists, but service layer and module organization are not active yet. |
| Readability | 7/10 | Files are small and easy to follow; comments are helpful but some are stale. |
| Maintainability | 5/10 | Simple codebase now, but missing central error handling, validation, and consistent structure will hurt as it grows. |
| Scalability | 3/10 | No pagination, no booking ownership model, no domain services, no indexes beyond user email. |
| Security | 4/10 | Password hashing, JWT, and Helmet exist, but authorization, rate limiting, validation, CORS restriction, and env validation are missing. |
| Production Readiness | 3/10 | Good early foundation, but missing many production controls, tests, deployment docs, and operational safeguards. |
| Overall Score | 4.5/10 | Promising MVP foundation, but not production-ready yet. |

---

# 18. Save Report

This file is saved as:

```text
PROJECT_ANALYSIS.md
```

Location:

```text
smart-car-driver-booking-platform/PROJECT_ANALYSIS.md
```

No source code changes are required by this report.

