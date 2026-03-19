import sqlite3 from 'better-sqlite3';
import path from 'path';
import crypto from 'crypto';

const dbPath = path.resolve(process.cwd(), 'database.sqlite');
const db = sqlite3(dbPath, { verbose: console.log });

// Create a Frontend Developer Campaign
const frontendCampaignId = crypto.randomUUID();
db.prepare('INSERT INTO campaigns (id, name) VALUES (?, ?)').run(frontendCampaignId, 'Frontend Developer (React)');

// Create a Backend Developer Campaign
const backendCampaignId = crypto.randomUUID();
db.prepare('INSERT INTO campaigns (id, name) VALUES (?, ?)').run(backendCampaignId, 'Backend Developer (Node.js)');

// --- Frontend Questions ---
const q1Id = crypto.randomUUID();
db.prepare(`
  INSERT INTO questions (id, campaign_id, title, description, default_code, test_cases)
  VALUES (?, ?, ?, ?, ?, ?)
`).run(
    q1Id,
    frontendCampaignId,
    'Reverse a String',
    'Write a function that reverses a given string.',
    'function solution(str) {\n  // Your code here\n  return str;\n}',
    JSON.stringify([
        { input: '"hello"', expectedOutput: '"olleh"' },
        { input: '"world"', expectedOutput: '"dlrow"' },
        { input: '""', expectedOutput: '""' }
    ])
);

const q2Id = crypto.randomUUID();
db.prepare(`
  INSERT INTO questions (id, campaign_id, title, description, default_code, test_cases)
  VALUES (?, ?, ?, ?, ?, ?)
`).run(
    q2Id,
    frontendCampaignId,
    'Palindrome Checker',
    'Write a function that checks if a string is a palindrome. Return true or false.',
    'function solution(str) {\n  // Your code here\n  return false;\n}',
    JSON.stringify([
        { input: '"racecar"', expectedOutput: 'true' },
        { input: '"hello"', expectedOutput: 'false' },
        { input: '"A man, a plan, a canal: Panama".toLowerCase().replace(/[^a-z0-9]/g, "")', expectedOutput: 'true' }
    ])
);

// --- Backend Questions ---
const b1Id = crypto.randomUUID();
db.prepare(`
  INSERT INTO questions (id, campaign_id, title, description, default_code, test_cases)
  VALUES (?, ?, ?, ?, ?, ?)
`).run(
    b1Id,
    backendCampaignId,
    'Two Sum',
    'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nInput format is an array where [0] is the nums array and [1] is the target. E.g. [[2,7,11,15], 9]',
    'function solution(input) {\n  const nums = input[0];\n  const target = input[1];\n  // Your code here\n  return [];\n}',
    JSON.stringify([
        { input: '[[2,7,11,15], 9]', expectedOutput: '[0,1]' },
        { input: '[[3,2,4], 6]', expectedOutput: '[1,2]' },
        { input: '[[3,3], 6]', expectedOutput: '[0,1]' }
    ])
);

console.log('--- SEEDING COMPLETE ---');
console.log('Frontend Campaign ID:', frontendCampaignId);
console.log('Backend Campaign ID:', backendCampaignId);
