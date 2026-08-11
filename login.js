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
    email: String,
    password: String
});
const User = mongoose.models.User || mongoose.model('User', userSchema);

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        await connectToDatabase();
        const { email, password } = JSON.parse(event.body);

        const user = await User.findOne({ email });
        if (!user) {
            return { statusCode: 400, body: JSON.stringify({ message: 'Invalid email or password.' }) };
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return { statusCode: 400, body: JSON.stringify({ message: 'Invalid email or password.' }) };
        }

        return { 
            statusCode: 200, 
            body: JSON.stringify({ message: 'Logged in successfully!', username: user.username }) 
        };
    } catch (err) {
        console.error(err);
        return { statusCode: 500, body: JSON.stringify({ message: 'Server error during login.' }) };
    }
};