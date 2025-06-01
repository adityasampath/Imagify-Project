import mongoose from "mongoose";

const connectDB = async () => {
    try {
        mongoose.connection.on('connected', () => {
            console.log("Database Connected");
        });

        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });

        const mongoURI = process.env.MONGODB_URI;
        if (!mongoURI) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }

        // Connect to MongoDB without the database name in the URI
        await mongoose.connect(mongoURI, {
            dbName: 'ai-image' // Specify the database name here
        });

    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        process.exit(1);
    }
}

export default connectDB;