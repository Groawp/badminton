const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK with credentials
const serviceAccount = require('./path/to/your/firebase/credentials.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://your-project-id.firebaseio.com"
});

const app = express();
app.use(express.json());
app.use(cors());

// Firebase Firestore reference
const db = admin.firestore();

// Poll setup (using Firestore for persistence)
let poll = {
    question: "Who is signing up for this week's badminton game?",
    options: { "Monday": [], "Wednesday": [], "Friday": [] },
    votes: {},
    log: []
};

// Authentication endpoint (now using Firebase Authentication)
app.post('/login', async (req, res) => {
    const { token } = req.body; // This should be the Firebase ID Token sent by the frontend
    
    try {
        // Verify ID token from the frontend (this ensures the user is authenticated)
        const decodedUser = await admin.auth().verifyIdToken(token);
        const uid = decodedUser.uid;

        // Check if the user exists in Firestore (create if not)
        const userDoc = await db.collection('users').doc(uid).get();
        if (!userDoc.exists) {
            // Create a new user document in Firestore if it doesn't exist
            await db.collection('users').doc(uid).set({ username: decodedUser.name });
        }

        res.json({ success: true, message: "Login successful", user: decodedUser });
    } catch (error) {
        console.error(error);
        res.status(401).json({ success: false, message: "Invalid token" });
    }
});

// Get poll
app.get('/poll', (req, res) => {
    res.json(poll);
});

// Vote endpoint
app.post('/vote', async (req, res) => {
    const { username, option } = req.body;
    if (!poll.options.hasOwnProperty(option)) {
        return res.status(400).json({ success: false, message: "Invalid option" });
    }
    if (poll.votes[username]) {
        return res.status(400).json({ success: false, message: "User has already voted" });
    }
    poll.options[option].push(username);
    poll.votes[username] = option;
    poll.log.push(`${username} signed up for ${option}`);

    // Store vote in Firestore
    await db.collection('votes').doc(username).set({ option });

    res.json({ success: true, message: "Signup recorded", signups: poll.options });
});

// Unvote endpoint
app.post('/unvote', async (req, res) => {
    const { username } = req.body;
    if (!poll.votes[username]) {
        return res.status(400).json({ success: false, message: "User has not signed up yet" });
    }
    const previousVote = poll.votes[username];
    poll.options[previousVote] = poll.options[previousVote].filter(user => user !== username);
    delete poll.votes[username];
    poll.log.push(`${username} removed their signup`);

    // Remove vote from Firestore
    await db.collection('votes').doc(username).delete();

    res.json({ success: true, message: "Signup removed", signups: poll.options });
});

// Reset poll endpoint
app.post('/reset', async (req, res) => {
    poll = {
        question: "Who is signing up for this week's badminton game?",
        options: { "Monday": [], "Wednesday": [], "Friday": [] },
        votes: {},
        log: []
    };
    res.json({ success: true, message: "Signups have been reset" });
});

// Get activity log
app.get('/log', (req, res) => {
    res.json({ log: poll.log });
});

app.listen(5000, () => console.log('Server running on port 5000'));
