const sqlite3 = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = path.resolve(__dirname, '../../database.sqlite');
const db = sqlite3(dbPath);

const additionalMCQs = [
    // React
    {
        title: "React Key Prop",
        description: "Why is the 'key' prop important when rendering lists in React?",
        question_type: "mcq",
        category: "React",
        difficulty: "Easy",
        options: JSON.stringify([
            "It sets the unique ID of the HTML element",
            "It helps React identify which items have changed, been added, or removed",
            "It is used for styling the element with CSS",
            "It is required for accessibility purposes"
        ]),
        correct_answer: "It helps React identify which items have changed, been added, or removed",
        points: 50
    },
    {
        title: "React useEffect Hook",
        description: "When does the cleanup function in useEffect run?",
        question_type: "mcq",
        category: "React",
        difficulty: "Medium",
        options: JSON.stringify([
            "Only when the component unmounts",
            "Before the effect runs again and when the component unmounts",
            "After every render regardless of dependencies",
            "Only when the browser tab is closed"
        ]),
        correct_answer: "Before the effect runs again and when the component unmounts",
        points: 75
    },
    // Python
    {
        title: "Python List Comprehension",
        description: "What is the output of [x*2 for x in range(3)]?",
        question_type: "mcq",
        category: "Python",
        difficulty: "Easy",
        options: JSON.stringify([
            "[0, 2, 4]",
            "[2, 4, 6]",
            "[0, 1, 2]",
            "[2, 2, 2]"
        ]),
        correct_answer: "[0, 2, 4]",
        points: 50
    },
    {
        title: "Python GIL",
        description: "What does GIL stand for in Python (CPython)?",
        question_type: "mcq",
        category: "Python",
        difficulty: "Hard",
        options: JSON.stringify([
            "General Input Loop",
            "Global Interpreter Lock",
            "Global Interface Language",
            "Generic Internal Logic"
        ]),
        correct_answer: "Global Interpreter Lock",
        points: 100
    },
    // Java
    {
        title: "Java Memory Management",
        description: "Which part of memory is used for storing objects in Java?",
        question_type: "mcq",
        category: "Java",
        difficulty: "Medium",
        options: JSON.stringify([
            "Stack",
            "Heap",
            "PermGen",
            "Register"
        ]),
        correct_answer: "Heap",
        points: 75
    },
    // Node.js
    {
        title: "Node.js Event Loop Phases",
        description: "Which phase of the Node.js event loop executes setImmediate() callbacks?",
        question_type: "mcq",
        category: "Node.js",
        difficulty: "Medium",
        options: JSON.stringify([
            "Timers phase",
            "Poll phase",
            "Check phase",
            "Close callbacks phase"
        ]),
        correct_answer: "Check phase",
        points: 75
    },
    // System Design
    {
        title: "CAP Theorem",
        description: "In the context of the CAP theorem, what does 'A' stand for?",
        question_type: "mcq",
        category: "System Design",
        difficulty: "Medium",
        options: JSON.stringify([
            "Accuracy",
            "Availability",
            "Atomicity",
            "Adaptability"
        ]),
        correct_answer: "Availability",
        points: 75
    },
    {
        title: "Redis Data Types",
        description: "Which of the following is NOT a native Redis data type?",
        question_type: "mcq",
        category: "System Design",
        difficulty: "Easy",
        options: JSON.stringify([
            "Set",
            "Sorted Set",
            "List",
            "Table"
        ]),
        correct_answer: "Table",
        points: 50
    }
];

function seed() {
    console.log('Seeding more MCQs...');
    const insert = db.prepare(`
        INSERT INTO question_pool (id, title, description, question_type, category, difficulty, options, correct_answer, points, tags, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '[]', datetime('now'))
    `);

    let count = 0;
    for (const q of additionalMCQs) {
        // Check if exists
        const exists = db.prepare('SELECT id FROM question_pool WHERE title = ?').get(q.title);
        if (!exists) {
            insert.run(crypto.randomUUID(), q.title, q.description, q.question_type, q.category, q.difficulty, q.options, q.correct_answer, q.points);
            count++;
        }
    }
    console.log(`Seeded ${count} new MCQs into question_pool.`);
}

seed();
