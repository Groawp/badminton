const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Predefined users (username:password)
const users = {
    "user1": "password1",
    "user2": "password2"
};

// Sample poll
let poll = {
    question: "What is your favorite programming language?",
    options: { "JavaScript": 0, "Python": 0, "C++": 0, "Java": 0 },
    votes: {},
    log: []
};

// Authentication endpoint
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (users[username] && users[username] === password) {
        res.json({ success: true, message: "Login successful" });
    } else {
        res.status(401).json({ success: false, message: "Invalid credentials" });
    }
});

// Get poll
app.get('/poll', (req, res) => {
    res.json(poll);
});

// Vote endpoint
app.post('/vote', (req, res) => {
    const { username, option } = req.body;
    if (!poll.options.hasOwnProperty(option)) {
        return res.status(400).json({ success: false, message: "Invalid option" });
    }
    if (poll.votes[username]) {
        return res.status(400).json({ success: false, message: "User has already voted" });
    }
    poll.options[option]++;
    poll.votes[username] = option;
    poll.log.push(`${username} voted for ${option}`);
    res.json({ success: true, message: "Vote recorded" });
});

// Unvote endpoint
app.post('/unvote', (req, res) => {
    const { username } = req.body;
    if (!poll.votes[username]) {
        return res.status(400).json({ success: false, message: "User has not voted yet" });
    }
    const previousVote = poll.votes[username];
    poll.options[previousVote]--;
    delete poll.votes[username];
    poll.log.push(`${username} removed their vote`);
    res.json({ success: true, message: "Vote removed" });
});

// Reset poll endpoint
app.post('/reset', (req, res) => {
    poll = {
        question: "What is your favorite programming language?",
        options: { "JavaScript": 0, "Python": 0, "C++": 0, "Java": 0 },
        votes: {},
        log: []
    };
    res.json({ success: true, message: "Poll has been reset" });
});

// Get activity log
app.get('/log', (req, res) => {
    res.json({ log: poll.log });
});

app.listen(5000, () => console.log('Server running on port 5000'));
