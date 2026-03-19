# HackRank: Professional Interview Platform

HackRank is a high-integrity, proctored technical interview platform designed for hiring managers to conduct JavaScript coding assessments with advanced malpractice prevention.

## 🚀 Core Components

### 1. Admin Dashboard (`/admin`)
The central command center for hiring managers and administrators.
- **Campaign Management**:
    - Create time-bound hiring campaigns (e.g., "Q3 Senior Backend Role").
    - **Duration Control**: Set specific time limits (in minutes) for each test.
    - **Status Lifecycle**: Toggle campaigns between **Live** (active) and **Archived** (blocks all candidate access instantly).
    - **Invite System**: Generate and share unique candidate invite links.
- **Global Question Pool**:
    - Maintain a central repository of reusable questions.
    - Classify questions by **Difficulty** (Easy, Medium, Hard) and **Category** (DSA, Math, Strings, Arrays, etc.).
    - **Smart Preview**: Inspect question descriptions, starter code, and test cases through an interactive modal before committing them to a campaign.
- **Candidate Monitoring & Proctoring**:
    - **Real-time Surveillance Logs**: View periodic, un-mirrored camera snapshots and entire-screen captures for every candidate.
    - **Malpractice Metrics**: Track tab-switching frequency and focus-loss events.
    - **Submission Review**: Analyze candidate code with syntax highlighting and see their test case pass/fail results.

### 2. Candidate Experience (`/candidate/[campaignId]`)
A streamlined, high-performance IDE built for focus and integrity.
- **Onboarding & Security**:
    - **Detailed Briefing**: Candidates receive a full breakdown of the test format, duration, and proctoring rules before starting.
    - **Strict Permissions**: Enforces camera access and **Entire Screen Sharing** (blocks window/tab-only sharing).
- **Proctored IDE**:
    - **Monaco Editor**: A VS Code-like editing experience with JavaScript support.
    - **Live Countdown Timer**: A high-visibility clock that automatically submits the test if time expires.
    - **Fullscreen Lock**: The test runs in fullscreen to minimize distractions and malpractice.
    - **Tab Switch Detection**: Aggressively monitors and warns candidates if they leave the browser tab or switch windows.
    - **Picture-in-Picture (PiP)**: Constant live webcam feedback within the workspace.
- **Evaluation**:
    - **Run Code**: Execute JS code against developer-defined test cases with instant terminal output.
    - **Final Submission**: A dual-confirmation flow to prevent accidental early finishers.

## 🛡️ Security & Integrity Features

- **Anti-Cheat Screenshots**: Automates high-quality JPEG captures of both the candidate's face and their entire screen every 30 seconds.
- **Stream Guard**: Native detection to ensure candidates share their primary monitor rather than individual browser tabs.
- **Access Control**: Archived campaigns actively reject login attempts at the API level with a 403 Forbidden status.
- **Browser Blur Tracking**: Records every instance the candidate loses window focus, permanently marking their submission report for review.

## 🛠️ Technical Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Frontend Logic**: React (Hooks-heavy for stream management)
- **Database**: [SQLite](https://sqlite.org/) (via `better-sqlite3`) for lightweight, high-performance data persistence.
- **Code Editor**: [@monaco-editor/react](https://www.npmjs.com/package/@monaco-editor/react)
- **Icons**: [Lucide-React](https://lucide.dev/)
- **Styling**: Vanilla CSS with modern Glassmorphism aesthetics.
- **Execution Sandbox**: Node.js `vm` module for safe candidate code isolation.
