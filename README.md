# CreditAI - AI Powered Alternate Credit Scoring

## Setup Instructions

### Backend
cd backend

pip install -r requirements.txt

uvicorn main:app --reload

### Frontend

cd frontend

npm install

npm run dev
The AI-Powered Alternate Credit Scoring System is a machine learning–driven framework designed to assess the creditworthiness of individuals and MSMEs who lack traditional bureau histories.

Conventional scoring models depend heavily on rigid financial metrics, excluding under-banked and thin-file borrowers. Our system leverages alternative financial and behavioral indicators such as transaction trends, utility payments, digital activity patterns, and revenue stability to provide a more inclusive and data-driven risk evaluation.

🔬 Technical Implementation

Built using Python and Jupyter Notebook, the solution implements:

Logistic Regression (baseline)

Random Forest (feature importance)

XGBoost (primary PD prediction model)

SMOTE for class imbalance handling

SHAP Explainable AI for transparency

Fairness auditing using Disparate Impact Ratio

📊 Core Outputs

Probability of Default (PD)

Risk Bands (Low / Medium / High)

Model Confidence Score

Explainable prediction factors

The system follows a structured ML workflow:
Data Processing → Feature Engineering → Model Training → Evaluation → Explainability → Risk Classification

🚀 Intelligent Enhancement Layers

To strengthen reliability and prevent manipulation, we introduced additional intelligence modules:

1️⃣ Re-Application Detection Module

Monitors repeated submissions using:

Phone number

IP address

Similar user inputs

Rapid re-apply attempts

Provides an admin dashboard panel to flag duplicate or optimization attempts, improving fraud visibility and compliance control.

2️⃣ Decision Confidence Score (Supplementary Layer)

In tie-breaker situations, the system computes a 100-point behavioral confidence score based on:

Interaction Stability (option switching patterns)

Response Time Analysis (decision timing)

This does not replace credit scoring but enhances decision reliability.

3️⃣ Adaptive Question Refinement Engine

Instead of immediate rejection for borderline cases, the system dynamically triggers additional questions on:

Assets, liabilities

Dependents

Loan purpose

Income stability

Profession and tenure

This recalculates an internal refinement score, preventing unnecessary exclusion and improving fairness.

4️⃣ Loan Approval Analytics Dashboard

Provides system-level insights including:

Total applications

Approval rate

Fraud detection metrics

Confidence-score correlation

Number of applicants saved via refinement

🎯 Overall Impact

This enhanced framework operates as a multi-layer intelligent credit decision engine combining:

Machine Learning risk prediction

Explainable AI transparency

Fairness auditing

Behavioral analysis

Re-application monitoring

Adaptive risk refinement

The result is a scalable, transparent, bias-aware, and manipulation-resistant credit assessment system designed for modern financial institutions and inclusive lending ecosystems.
