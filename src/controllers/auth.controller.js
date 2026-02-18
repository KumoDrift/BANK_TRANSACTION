import userModel from "../models/user.model.js";
import jwt from "jsonwebtoken";
import "dotenv/config";
import { sendRegistrationEmail } from "../services/email.service.js";

/**
 * ========================================================================
 * EMAIL SENDING WITH GMAIL API - SETUP INSTRUCTIONS
 * ========================================================================
 *
 * After creating a user in the database, you can send verification emails
 * and other transactional emails to users using Google Cloud's Gmail API
 * with Nodemailer.
 *
 * STEP 1: CREATE GOOGLE CLOUD PROJECT
 * -----------------------------------
 * 1. Go to Google Cloud Console (console.cloud.google.com)
 * 2. Create a new project and name it (e.g., "BankTransaction App")
 * 3. Navigate to the project dashboard
 *
 * STEP 2: ENABLE GMAIL API
 * ------------------------
 * 1. Go to the API Library in Google Cloud Console
 * 2. Search for "Gmail API"
 * 3. Click on it and press the "ENABLE" button
 *
 * STEP 3: CONFIGURE OAUTH CONSENT SCREEN
 * ---------------------------------------
 * 1. Navigate to APIs & Services > OAuth consent screen
 * 2. Choose "External" as the User Type
 * 3. Fill in the required fields:
 *    - App name: Your project name (e.g., "BankTransaction")
 *    - User support email: Your company's email (NOT personal email)
 *    - Developer contact information: Your company's email
 * 4. Add necessary scopes for Gmail:
 *    - https://www.googleapis.com/auth/gmail.send
 * 5. Add test users (your company's email for testing)
 * 6. Save and continue
 *
 * STEP 4: CREATE OAUTH 2.0 CREDENTIALS
 * ------------------------------------
 * 1. Go to APIs & Services > Credentials
 * 2. Click "Create Credentials" > "OAuth client ID"
 * 3. Choose Application type: "Web application"
 * 4. Add Authorized redirect URIs:
 *    - http://localhost:3000 (or your local port)
 *    - https://developers.google.com/oauthplayground
 * 5. Click "Create" - you'll get Client ID and Client Secret
 * 6. Download/copy these credentials securely
 *
 * STEP 5: SETUP NODEMAILER WITH GMAIL API
 * ----------------------------------------
 * 1. Install nodemailer: npm install nodemailer
 * 2. Create a config file for nodemailer with Gmail credentials
 * 3. Use the Gmail API with nodemailer to send emails
 * 4. Store your credentials in .env file:
 *    - GMAIL_USER=your-company-email@gmail.com
 *    - GMAIL_CLIENT_ID=your-client-id
 *    - GMAIL_CLIENT_SECRET=your-client-secret
 *    - GMAIL_REFRESH_TOKEN=your-refresh-token
 *
 * EXAMPLE IMPLEMENTATION:
 * ----------------------
 * After user.create() is successful, you can send a welcome email:
 *
 *   const transporter = nodemailer.createTransport({
 *     service: 'gmail',
 *     auth: {
 *       type: 'OAuth2',
 *       user: process.env.GMAIL_USER,
 *       clientId: process.env.GMAIL_CLIENT_ID,
 *       clientSecret: process.env.GMAIL_CLIENT_SECRET,
 *       refreshToken: process.env.GMAIL_REFRESH_TOKEN
 *     }
 *   });
 *
 *   const mailOptions = {
 *     from: process.env.GMAIL_USER,
 *     to: user.email,
 *     subject: 'Welcome to BankTransaction',
 *     html: `<h1>Welcome ${user.name}!</h1>
 *            <p>Your account has been created successfully.</p>`
 *   };
 *
 *   await transporter.sendMail(mailOptions);
 *
 * DOCUMENTATION:
 * ---------------
 * Reference: https://github.com/ankurdotio/Difference-Backend-video/tree/main/026-nodemailer
 * ========================================================================
 */

/**
 * - user register controller
 * - POST /api/auth/register
 */
async function userRegisterController(req, res) {
  const { email, password, name } = req.body;

  const isExists = await userModel.findOne({
    email: email,
  });

  if (isExists) {
    return res.status(422).json({
      message: "User already exists with email.",
      status: "failed",
    });
  }

  const user = await userModel.create({
    email,
    password,
    name,
  });

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "3d",
  });

  res.cookie("token", token);

  res.status(201).json({
    user: {
      _id: user._id,
      email: user.email,
      name: user.name,
    },
    token,
  });

  await sendRegistrationEmail(user.email, user.name).catch((error) => {
    console.error("Error sending registration email:", error);
  });
}

/**
 * - User Login Controller
 * - POST /api/auth/login
 */

async function userLoginController(req, res) {
  const { email, password } = req.body;

  const user = await userModel.findOne({ email }).select("+password");

  if (!user) {
    return res.status(401).json({
      message: "Email or password is INVALID",
    });
  }

  const isValidPassword = await user.comparePassword(password);

  if (!isValidPassword) {
    return res.status(401).json({
      message: "Email or password is INVALID",
    });
  }

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "3d",
  });

  res.cookie("token", token);

  res.status(200).json({
    user: {
      _id: user._id,
      email: user.email,
      name: user.name,
    },
    token,
  });
}

export { userRegisterController, userLoginController };
