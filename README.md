Vyuhaa Med Screen – Cervical Cytology Workflow Platform

This repository contains the workflow codebase for Vyuhaa Med’s digital cervical cytology screening platform. It enables digitization, AI-assisted diagnostics, and efficient workflows for large-scale cervical cancer screening programs.

Table of Contents

Overview

Architecture

Tech Stack

Setup Guide

Usage

Environment Variables

Testing

Deployment

Contributing

License

📌 Overview

The platform provides a digital pathology workflow for cervical cytology slides:

Slide Digitization → Uploads & manages scanned cytology slides.

AI-Assisted Diagnostics (CerviAI) → Assists pathologists with cytology interpretation.

Workflow Automation → Manages patient metadata, triaging, and reporting.

Scalable Infrastructure → Built for large cohort studies (50k+ patients).

🏗️ Architecture
flowchart LR
    A[Slide Digitization] --> B[Image Ingestion]
    B --> C[CerviAI AI Model]
    C --> D[Diagnosis Review by Pathologists]
    D --> E[Reporting & Analytics]
    E --> F[Database & Storage]


Digitization: High-resolution whole-slide images from partner scanners.

Processing: Preprocessing pipeline built with Vite + React + TS.

AI Layer: CerviAI inference for triaging suspicious cases.

Pathologist Review: Remote/assisted reporting via secure dashboards.

Reporting: Exports structured diagnostic reports for integration with EMRs.

🛠️ Tech Stack

Frontend: React + Vite + TypeScript

UI: shadcn-ui + Tailwind CSS

Backend: Node.js (Express / APIs)

AI Integration: CerviAI inference APIs

Database: MongoDB / PostgreSQL (configurable)

Deployment: Docker + Cloud (AWS/Azure/GCP)

⚡ Setup Guide
Requirements

Node.js & npm
 (via nvm)

Installation
# Clone the repository
git clone https://github.com/dhritimanmallick/vyuhaa-med-screen.git

# Navigate to project folder
cd vyuhaa-med-screen

# Install dependencies
npm install

# Start development server
npm run dev

▶️ Usage

Run locally → npm run dev

Build production bundle → npm run build

Preview build → npm run preview

🔑 Environment Variables

Create a .env file in the project root with:

PORT=3000
DB_URL=<your_database_url>
AI_API_KEY=<your_cerviai_api_key>

✅ Testing
# Run tests
npm run test

# Run linting
npm run lint

🚀 Deployment

Build app:

npm run build


Serve via Node.js or containerize with Docker.

Deploy to AWS/GCP/Azure or hospital on-prem systems.

🤝 Contributing

We welcome contributions!

Fork the repo

Create a feature branch (git checkout -b feature/new-feature)

Commit changes (git commit -m 'Added new feature')

Push & open a Pull Request

📜 License

© 2025 Vyuhaa Med Data. All rights reserved.
This project is proprietary and not open-source.
