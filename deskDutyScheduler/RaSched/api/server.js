// server.js
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
// app.use(cors({ origin: 'http://localhost:3000' }));  // If React is running on port 3000


// Get the MongoDB URI from the .env file
const mongoURI = process.env.MONGO_URI;
// console.log(mongoURI)

if (!mongoURI) {
    console.error("MongoDB URI is missing from .env file");
    process.exit(1);
}
// MongoDB connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("Connected to MongoDB");
    })
    .catch((error) => {
        console.error("MongoDB connection error:", error);
    });// Define schema and model

const unavailabilitySchema = new mongoose.Schema({
    userName: String,
    unavailability: {
        Monday: String,   // Change to String type
        Tuesday: String,
        Wednesday: String,
        Thursday: String,
        Friday: String,
    },
});



const Unavailability = mongoose.model('Unavailability', unavailabilitySchema, 'RAUnavailabilities');

// Define POST endpoint
app.post('/api/unavailability', async (req, res) => {
    // console.log('Request body:', req.body);

    const { userName, unavailability } = req.body;

    // Check if any day has an empty unavailability field and handle it.
    Object.keys(unavailability).forEach((day) => {
        if (!unavailability[day] || unavailability[day] === '') {
            unavailability[day] = '';  // or you could leave it as empty, depending on your logic
        }
    });

    const newUnavailability = new Unavailability({
        userName,
        unavailability,
    });

    try {
        await newUnavailability.save();
        res.status(201).send({ message: 'Unavailability saved successfully!' });
    } catch (error) {
        console.error('Error saving unavailability:', error);
        res.status(500).send({ message: 'Failed to save unavailability data' });
    }
});


// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
