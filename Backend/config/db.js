import mongoose from 'mongoose'; // MongoDB se baat karne ke liye library
import dotenv from 'dotenv'; // Environment variables read karne ke liye

dotenv.config(); // .env file ko load kiya

const connectDB = async () => {
    try {
        
        const conn = await mongoose.connect(process.env.MONGO_URI);

        console.log(`MongoDB Connected: ${conn.connection.host} 🔥`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1); 
    }
};

export default connectDB; //it is used in index.js