# Spec: MedSimplify

## Overview
An AI-powered web application that converts complex medical reports into simple, patient-friendly explanations in multiple Indian languages.

## Problem
Most people receive medical reports filled with jargon they don't understand. They either panic, ignore findings, or wait anxiously for their doctor.

## User Stories

### US-001: Upload a Medical Report
**As a** patient,
**I want to** upload or paste my medical report,
**So that** I can get it explained in simple language.

**Acceptance Criteria:**
- User can paste text directly
- User can upload a PDF or image file
- System confirms report is loaded before analysis

### US-002: Get Simplified Explanation
**As a** patient,
**I want to** see my medical report explained in plain language,
**So that** I can understand what my results mean.

**Acceptance Criteria:**
- Each finding is explained without medical jargon
- Each finding is color-coded (Normal / Monitor / See Doctor)
- A summary of the overall report is shown

### US-003: Get Detailed Information
**As a** patient,
**I want to** see causes, questions to ask my doctor, and lifestyle tips,
**So that** I can prepare for my appointment.

**Acceptance Criteria:**
- Expandable "What does this mean?" section per finding
- Shows common causes, doctor questions, and lifestyle tips

### US-004: Choose Explanation Mode
**As a** patient,
**I want to** choose how detailed the explanation is,
**So that** I can get the level of detail I need.

**Acceptance Criteria:**
- Standard mode: clear medical explanation
- ELI5 mode: super simple language
- Doctor Visit Summary mode: key questions to ask

### US-005: Multi-language Support
**As a** patient in India,
**I want to** read my report explanation in my native language,
**So that** I can understand it better.

**Acceptance Criteria:**
- Supports English, Hindi, Marathi, Tamil, Telugu, Kannada
- Entire response including labels is in selected language

### US-006: Ethical Disclaimer
**As a** patient,
**I want to** be reminded that this is not a diagnosis,
**So that** I know to still consult my doctor.

**Acceptance Criteria:**
- Disclaimer shown on every result page
- Clear message that tool does not replace medical advice
