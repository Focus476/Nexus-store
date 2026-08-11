const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI;
let cachedDb = null;

async function connectToDatabase() {
    if (cachedDb) return;
    await mongoose.connect(MONGO_URI);
    cachedDb = mongoose.connection;
}

const userSchema = new mongoose.Schema({
    username: String,
    email: { type: String, unique: true },
    password: String
});
const User = mongoose.models.User || mongoose.model('User', userSchema);

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        await connectToDatabase();
        const { username, email, password } = JSON.parse(event.body);

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return { statusCode: 400, body: JSON.stringify({ message: 'Email already registered.' }) };
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();

        return { statusCode: 201, body: JSON.stringify({ message: 'User registered successfully!' }) };
    } catch (err) {
        console.error(err);
        return { statusCode: 500, body: JSON.stringify({ message: 'Server error during registration.' }) };
    }
};