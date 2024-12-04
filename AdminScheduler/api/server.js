import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { spawn } from 'child_process';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB connection
const mongoURI = process.env.MONGO_URI;

if (!mongoURI) {
    console.error("MongoDB URI is missing from .env file");
    process.exit(1);
}

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("Connected to MongoDB"))
    .catch((error) => console.error("MongoDB connection error:", error));

// Define schema and model
const unavailabilitySchema = new mongoose.Schema({
    username: { type: String, required: true },
    unavailability: {
        Monday: { type: String, default: '' },
        Tuesday: { type: String, default: '' },
        Wednesday: { type: String, default: '' },
        Thursday: { type: String, default: '' },
        Friday: { type: String, default: '' },
    },
}, { collection: 'RAUnavailabilities' });

const Unavailability = mongoose.model('Unavailability', unavailabilitySchema);

// Routes
app.get('/all-unavailabilities', async (req, res) => {
    try {
        const documents = await Unavailability.find({});
        res.status(200).json(documents);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching documents', error });
    }
});

app.delete('/delete-unavailability/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deletedDocument = await Unavailability.findByIdAndDelete(id);

        if (!deletedDocument) {
            return res.status(404).json({ message: 'Unavailability not found' });
        }

        res.status(200).json({ message: 'Unavailability deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting document', error });
    }
});

// Route to delete all unavailabilities
app.delete('/delete-all-unavailabilities', async (req, res) => {
    try {
        // Delete all documents in the collection
        const result = await Unavailability.deleteMany({});

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'No unavailabilities to delete' });
        }

        res.status(200).json({ message: 'All unavailabilities deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting all unavailabilities', error });
    }
});


app.post('/run-optimizer', (req, res) => {
    try {
        const data = req.body;

        const pythonProcess = spawn('py', ['-3.10', './optimizer.py', JSON.stringify(data)]);

        pythonProcess.on('error', (err) => {
            console.error('Failed to start Python script:', err);
            return res.status(500).json({ error: 'Failed to start Python script' });
        });

        let result = '';
        pythonProcess.stdout.on('data', (chunk) => {
            result += chunk.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error('Python error output:', data.toString());
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                console.error(`Python script exited with code ${code}`);
                return res.status(500).json({ error: 'Optimizer script failed', exitCode: code });
            }

            try {
                const parsedResult = JSON.parse(result);
                res.status(200).json(parsedResult);
            } catch (e) {
                console.error("Failed to parse result as JSON:", e);
                res.status(500).json({ error: 'Failed to parse result from Python' });
            }
        });
    }
    catch (e) {
        return res.status(500).json({ error: 'Optimizer script failed', exitCode: code });
    }
});

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
