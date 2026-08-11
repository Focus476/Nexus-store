const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet'); // 1. IMPORT HELMET
const rateLimit = require('express-rate-limit'); // 2. IMPORT RATE LIMITER

const app = express();

// --- SECURITY MIDDLEWARE ---
app.use(helmet()); // Secures HTTP headers
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors({ origin: 'http://localhost:3000', credentials: true })); // Adjust for your frontend domain if needed
app.use(cookieParser());

// Rate limit login attempts to prevent brute-force attacks
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login requests per windowMs
    message: 'Too many login attempts from this IP, please try again after 15 minutes.'
});

// --- MONGODB CLOUD CONNECTION ---
const username = "myAppUser"; 
const rawPassword = "Tengo2012"; 

const encodedPassword = encodeURIComponent(rawPassword);
const dbURI = `mongodb+srv://${username}:${encodedPassword}@cluster0.9a1wral.mongodb.net/nexus-store?retryWrites=true&w=majority&appName=Cluster0`;

mongoose.connect(dbURI)
    .then(() => console.log('Database Connected Successfully'))
    .catch(err => console.log('Database Connection Error:', err));

// --- USER SCHEMA & MODEL ---
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

// --- REGISTRATION ENDPOINT ---
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).send('User with this email already exists.');
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            username,
            email,
            password: hashedPassword
        });

        await newUser.save();
        res.status(201).send('Account successfully created and saved to database!');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error during registration.');
    }
});

// --- LOGIN ENDPOINT (WITH RATE LIMITER) ---
app.post('/api/login', loginLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).send('Invalid email or password.');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).send('Invalid email or password.');
        }

        res.cookie('nexusUser', user.username, { 
            maxAge: 900000, 
            httpOnly: true,
            secure: false // Set to true if using HTTPS in production
        });

        res.status(200).send(`Welcome back, ${user.username}! Login successful.`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error during login.');
    }
});

// --- AUTH CHECK ROUTE (For Frontend to verify cookies) ---
app.get('/api/check-auth', (req, res) => {
    const userCookie = req.cookies.nexusUser;
    if (userCookie) {
        return res.status(200).json({ isAuthenticated: true, username: userCookie });
    }
    res.status(401).json({ isAuthenticated: false });
});

// --- START SERVER ---
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});