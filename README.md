# HackOddsey

HackOddsey is a full-stack hackathon management and evaluation platform designed to manage the complete hackathon workflow — from team registration and problem-statement selection to evaluator scoring, live leaderboards, feedback, and administrative reporting.

The platform provides dedicated workflows for **Teams, Evaluators, and Administrators**, with PostgreSQL as the source of truth and FastAPI APIs connecting the backend to the React frontend.

---

## Features

### Team Management
- Team registration and authentication
- Team dashboard
- Team member management
- Problem statement selection
- First-come-first-served problem capacity
- Group photo upload
- Repository submission
- Evaluator feedback
- Evaluation status tracking

### Problem Statements
- Create and manage problem statements
- Configure problem availability
- Release problems to teams
- Limit the number of teams that can select a problem
- Prevent over-allocation
- Track selected teams

### Round Management
- Create and manage hackathon rounds
- Activate/deactivate rounds
- Assign evaluators to rounds
- Track round progression

### Evaluation System
- Evaluator authentication
- Evaluator dashboard
- Assigned-team evaluation
- Score submission
- Feedback submission
- Evaluation status tracking
- Round-specific scoring

### Leaderboard
- Round-wise leaderboard
- Overall leaderboard
- Team ranking
- Team group photo
- Live leaderboard updates
- Team search
- Tie-aware ranking

### Administration
- Admin dashboard
- Team management
- Problem-statement management
- Round management
- Evaluator management
- Evaluation monitoring
- Leaderboard monitoring
- Reports

### Reports
- Evaluation/report generation
- PDF reporting
- Administrative data views

---

# Architecture

HackOddsey follows a frontend/backend architecture:

```text
                    ┌──────────────────────┐
                    │      React UI        │
                    │ TypeScript + Vite    │
                    │ Tailwind CSS         │
                    └──────────┬───────────┘
                               │
                         HTTP / WebSocket
                               │
                               ▼
                    ┌──────────────────────┐
                    │      FastAPI         │
                    │      Backend         │
                    └──────────┬───────────┘
                               │
                 ┌─────────────┴─────────────┐
                 │                           │
                 ▼                           ▼
        ┌─────────────────┐        ┌─────────────────┐
        │   SQLAlchemy    │        │   Application   │
        │      ORM        │        │    Services     │
        └────────┬────────┘        └─────────────────┘
                 │
                 ▼
        ┌─────────────────┐
        │   PostgreSQL    │
        │    Database     │
        └─────────────────┘
```

---

# Technology Stack

## Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios
- Lucide React
- WebSocket

## Backend
- Python
- FastAPI
- Uvicorn
- SQLAlchemy
- Alembic
- JWT Authentication
- Argon2id Password Hashing
- WebSockets
- ReportLab

## Database
- PostgreSQL

## Development Tools
- Git
- GitHub
- Postman
- Swagger / OpenAPI
- VS Code

---

# Project Structure

```text
HackOddsey/
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models/
│   │   ├── routers/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── ...
│   ├── alembic/
│   ├── alembic.ini
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── contexts/
│   │   └── ...
│   ├── package.json
│   ├── vite.config.ts
│   └── ...
│
├── README.md
└── ...
```

---

# User Roles

## Team
Teams can:
- Register and log in
- Manage team information
- View their dashboard
- Select problem statements
- Upload group photos
- Submit repositories
- View evaluation status
- View scores
- View feedback
- View leaderboards

## Evaluator
Evaluators can:
- Log in
- View assigned rounds
- View assigned teams
- Evaluate teams
- Submit scores
- Provide feedback
- Track completed evaluations

## Administrator
Administrators can:
- Manage teams
- Manage problem statements
- Manage rounds
- Manage evaluators
- Assign evaluators
- Monitor evaluations
- Monitor leaderboards
- Generate reports
- Manage hackathon operations

---

# Complete Hackathon Workflow

```text
START
  │
  ▼
Team Registration
  │
  ▼
Team Login
  │
  ▼
Team Dashboard
  │
  ▼
Problem Statement Released
  │
  ▼
Team Selects Problem
  │
  ▼
Capacity / Availability Check
  │
  ├── Available ──► Selection Confirmed
  │
  └── Full ───────► Selection Rejected
                         │
                         ▼
                  Team Works on Project
                         │
                         ▼
                  Repository Submission
                         │
                         ▼
                    Hackathon Round
                         │
                         ▼
                   Evaluator Assignment
                         │
                         ▼
                     Team Evaluation
                         │
                         ▼
                    Score + Feedback
                         │
                         ▼
                  Evaluation Submitted
                         │
                         ▼
                      Leaderboard
                         │
                         ▼
                   Next Round / Overall
                         │
                         ▼
                        END
```

---

# Problem Statement Workflow

```text
Admin Creates Problem
        │
        ▼
Problem Released
        │
        ▼
Teams Can View Problem
        │
        ▼
Team Selects Problem
        │
        ▼
Capacity Check
        │
        ├── Available ──► Selection Confirmed
        │
        └── Full ───────► Selection Rejected
```

The number of teams allowed to select a problem statement is configurable through backend environment configuration rather than being hard-coded.

---

# Evaluation System

Each evaluation is associated with:

```text
Team
  │
  └── Evaluation
        │
        ├── Round
        ├── Evaluator
        ├── Score
        ├── Feedback
        └── Status
```

An evaluation becomes eligible for leaderboard calculation when:

```text
status = submitted
```

and:

```text
score IS NOT NULL
```

This prevents incomplete evaluations from appearing in the leaderboard.

---

# Leaderboard System

For a selected round:

```text
Evaluation
    │
    ├── Team
    ├── Round
    ├── Score
    └── Status
         │
         ▼
   Submitted Only
         │
         ▼
    Sort by Score
         │
         ▼
      Ranking
```

The leaderboard uses tie-aware ranking.

Example:

```text
Rank  Team        Score
1     Team Alpha  95
2     Team Beta   90
2     Team Gamma  90
4     Team Delta  82
```

The frontend displays ranking data returned by the backend.

---

# Overall Leaderboard

The overall leaderboard aggregates submitted scores across rounds.

```text
Round 1     Round 2     Round 3
   │           │           │
   └───────────┴───────────┘
               │
               ▼
        Total Team Score
               │
               ▼
       Overall Ranking
```

Example:

```text
Team A
Round 1 = 80
Round 2 = 85
Round 3 = 90

Overall = 255
```

The aggregation is performed by the backend using SQLAlchemy/PostgreSQL.

Conceptually:

```sql
SUM(evaluation.score)
GROUP BY team
```

Only submitted evaluations with valid scores are included.

---

# Real-Time Leaderboard

Round leaderboards support WebSocket-based updates.

```text
Evaluator submits score
          │
          ▼
       Backend
          │
          ▼
 Database updated
          │
          ▼
Leaderboard update
          │
          ▼
 WebSocket broadcast
          │
          ▼
     Frontend UI
          │
          ▼
 Updated leaderboard
```

---

# Team Dashboard

The team dashboard acts as the central workspace for participating teams.

```text
Login
  │
  ▼
Dashboard
  │
  ├── Team Information
  ├── Members
  ├── Problem Statement
  ├── Group Photo
  ├── Repository
  ├── Evaluation
  ├── Feedback
  └── Leaderboard
```

---

# Database

PostgreSQL is used as the primary database.

SQLAlchemy provides the ORM layer while Alembic handles database migrations.

```text
FastAPI
   │
   ▼
SQLAlchemy
   │
   ▼
PostgreSQL
```

Example migration workflow:

```bash
alembic revision --autogenerate -m "description"
alembic upgrade head
```

---

# Authentication

HackOddsey uses token-based authentication.

```text
User Login
    │
    ▼
Credentials Verified
    │
    ▼
Password Verification
    │
    ▼
JWT Token Generated
    │
    ▼
Frontend Authentication State
    │
    ▼
Token Sent With API Requests
    │
    ▼
Backend Validates Token
```

Passwords are protected using Argon2id hashing.

---

# API Documentation

FastAPI provides interactive API documentation.

Swagger UI:

```text
http://127.0.0.1:8000/docs
```

OpenAPI:

```text
http://127.0.0.1:8000/openapi.json
```

Swagger can be used to:
- Explore endpoints
- Inspect request schemas
- Inspect response schemas
- Authenticate requests
- Test API endpoints
- Debug backend functionality

---

# Environment Configuration

Example:

```env
DATABASE_URL=postgresql+psycopg://username:password@localhost:5432/hackoddsey

SECRET_KEY=your_secret_key

PROBLEM_SELECTION_CAPACITY=4
```

The exact environment variables should match the project's current backend configuration.

Sensitive values such as database passwords and secret keys should not be committed to Git.

---

# Local Development Setup

## Prerequisites

Install:
- Python
- Node.js
- npm
- PostgreSQL
- Git

Recommended:
- Postman
- VS Code

---

# Backend Setup

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate it.

### Windows CMD

```cmd
venv\Scriptsctivate
```

### Windows PowerShell

```powershell
venv\Scripts\Activate.ps1
```

### Git Bash

```bash
source venv/Scripts/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create the PostgreSQL database:

```sql
CREATE DATABASE hackoddsey;
```

Configure the `.env` file.

Run migrations:

```bash
alembic upgrade head
```

Start the backend:

```bash
uvicorn app.main:app --reload
```

Backend:

```text
http://127.0.0.1:8000
```

Swagger:

```text
http://127.0.0.1:8000/docs
```

---

# Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

# Production Build

```bash
npm run build
```

Preview:

```bash
npm run preview
```

---

# Database Migrations

Create a migration:

```bash
alembic revision --autogenerate -m "description"
```

Apply migrations:

```bash
alembic upgrade head
```

Check current migration:

```bash
alembic current
```

View history:

```bash
alembic history
```

---

# Testing the API with Postman

Recommended workflow:

```text
Start FastAPI
     │
     ▼
Open Postman
     │
     ▼
Test Authentication
     │
     ▼
Copy JWT Token
     │
     ▼
Authorize Requests
     │
     ▼
Test API Endpoints
     │
     ▼
Verify Database Changes
```

Authenticated requests use:

```text
Authorization: Bearer <token>
```

---

# API Development Workflow

```text
1. Define Requirement
       ↓
2. Design Database Changes
       ↓
3. Create SQLAlchemy Model
       ↓
4. Create Alembic Migration
       ↓
5. Create Pydantic Schema
       ↓
6. Implement Service Logic
       ↓
7. Implement FastAPI Router
       ↓
8. Test with Swagger/Postman
       ↓
9. Connect Frontend
       ↓
10. Test Complete Workflow
```

---

# Reports

The backend includes reporting functionality using ReportLab.

General workflow:

```text
Database
   │
   ▼
Backend Query
   │
   ▼
Report Generation
   │
   ▼
PDF Output
```

---

# UI / UX

The frontend follows a consistent dashboard-oriented design system using:

- Tailwind CSS
- Reusable React components
- Responsive layouts
- Cards
- Tables
- Forms
- Dialog interactions
- Navigation layouts
- Status indicators
- Lucide React icons

The leaderboard provides:
- Podium
- Team rankings
- Scores
- Team images
- Search
- Round selection
- Overall leaderboard
- Live update status

---

# Frontend Data Flow

```text
React Component
      │
      ▼
API Service
      │
      ▼
Axios Request
      │
      ▼
FastAPI Endpoint
      │
      ▼
Database / Service
      │
      ▼
JSON Response
      │
      ▼
React State
      │
      ▼
UI
```

Critical backend business logic should not be duplicated in the frontend.

---

# Backend Data Flow

```text
HTTP Request
     │
     ▼
FastAPI Router
     │
     ▼
Authentication / Validation
     │
     ▼
Service Logic
     │
     ▼
SQLAlchemy
     │
     ▼
PostgreSQL
     │
     ▼
Response Schema
     │
     ▼
JSON Response
```

---

# Development Principles

## Backend as Source of Truth

Critical business logic remains on the backend.

Examples:
- Team selection capacity
- Evaluation status
- Score calculation
- Overall score aggregation
- Ranking
- Authorization

## Database Integrity

Database constraints and backend validation should prevent invalid application states.

## Small Incremental Changes

```text
Feature
  ↓
Backend
  ↓
Migration
  ↓
API
  ↓
Postman Test
  ↓
Frontend
  ↓
Integration Test
```

## Test Before Integration

Backend endpoints should be tested independently using Swagger or Postman before frontend integration.

## Preserve Existing Functionality

When modifying the application:
- Keep existing working features
- Avoid unnecessary rewrites
- Make the smallest required change
- Preserve existing navigation
- Preserve working dashboard functionality
- Verify frontend and backend after changes

---

# Git Workflow

Check status:

```bash
git status
```

View changes:

```bash
git diff
```

Stage:

```bash
git add .
```

Commit:

```bash
git commit -m "your commit message"
```

Push:

```bash
git push origin main
```

View latest commit:

```bash
git log -1 --oneline
```

Typical workflow:

```text
Make changes
    ↓
git status
    ↓
git diff
    ↓
git add .
    ↓
git commit
    ↓
git push
```

---

# Architecture Summary

```text
                         HACKODDSEY
                              │
             ┌────────────────┼────────────────┐
             │                │                │
             ▼                ▼                ▼
           TEAM           EVALUATOR          ADMIN
             │                │                │
             └────────────────┼────────────────┘
                              │
                              ▼
                         FASTAPI API
                              │
             ┌────────────────┼────────────────┐
             │                │                │
             ▼                ▼                ▼
        Authentication    Business Logic    WebSockets
             │                │                │
             └────────────────┼────────────────┘
                              │
                              ▼
                         SQLAlchemy
                              │
                              ▼
                         PostgreSQL
```

---

# Project Philosophy

```text
Manage the hackathon.
Evaluate the teams.
Track the scores.
Keep everything centralized.
```

HackOddsey brings team management, problem allocation, evaluation, feedback, leaderboard management, real-time updates, and administrative workflows into a single application.

---

# Quick Commands

## Backend

```bash
cd backend
source venv/Scripts/activate
uvicorn app.main:app --reload
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

## Database

```bash
alembic upgrade head
```

## Build

```bash
npm run build
```

## Git

```bash
git status
git add .
git commit -m "your message"
git push origin main
```

---

# HackOddsey

**Full-stack hackathon management, evaluation, and leaderboard platform.**
