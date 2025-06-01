import 'dotenv/config';
import express from 'express'
import cors from 'cors'
import userRouter from './routes/userRoutes.js';
import connectDB from './configs/mongodb.js';
import imageRouter from './routes/imageRoutes.js';

// App Config
const PORT = process.env.PORT || 4000
const app = express();

// Connect to MongoDB
await connectDB()

// Initialize Middlewares
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());

// Test logging
console.log('Environment check:');
console.log('- JWT_SECRET:', process.env.JWT_SECRET ? 'present' : 'missing');
console.log('- MONGODB_URI:', process.env.MONGODB_URI ? 'present' : 'missing');
console.log('- CLIPDROP_API:', process.env.CLIPDROP_API ? 'present' : 'missing');
console.log('Environment check:', {
    hasRazorpayKeyId: !!process.env.RAZORPAY_KEY_ID,
    hasRazorpayKeySecret: !!process.env.RAZORPAY_KEY_SECRET,
    hasJwtSecret: !!process.env.JWT_SECRET
});

// API routes
app.use('/api/user', userRouter)
app.use('/api/image', imageRouter)

app.get('/', (req,res) => res.send("API Working"))

app.listen(PORT, () => {
    console.log('Server running on port ' + PORT);
    console.log('Ready to handle requests...');
});
