

# AI Credit Scoring Dashboard

A dark, modern web dashboard to visualize and present your AI-powered alternative credit scoring system — perfect as a hackathon demo companion to your Python ML notebook.

## Design
- **Dark theme** with vibrant accent colors (electric blue, teal, amber for risk bands)
- Modern glassmorphism cards, smooth animations
- Responsive layout for both presentation screens and laptops

## Pages & Features

### 1. Overview Dashboard
- **KPI cards**: Total borrowers scored, average credit score, approval rate, AUC score
- **Risk band distribution** chart (Low / Medium / High risk — color coded)
- **Prediction probability distribution** histogram
- **Quick model summary** showing selected model and key metrics
- **Societal impact banner** highlighting financial inclusion stats

### 2. Borrower Profile Lookup
- Search/select a borrower from the dataset
- **Credit score gauge** with risk band label and color
- **SHAP waterfall chart** showing which features pushed the score up/down (local explainability)
- **Borrower details table** (debt-to-income ratio, payment utilization, etc.)
- Approve/Decline recommendation with confidence percentage

### 3. Model Performance
- **Model comparison table** (Logistic Regression, Random Forest, XGBoost, KNN) with Accuracy, Precision, Recall, F1, AUC
- **ROC curves** overlaid for all models
- **Confusion matrix** heatmap for selected model
- **Threshold optimization** slider showing precision/recall trade-off
- Cross-validation results display

### 4. Fairness & Bias Audit
- **Disparate Impact Ratio** gauge with 0.8 threshold line
- **Subgroup accuracy comparison** bar chart
- Bias flags with clear pass/fail indicators
- **Cost-sensitive simulation** panel: expected loss from false negatives, opportunity gain from true positives, total projected business impact

## Data Strategy
- Ships with **realistic mock data** so the dashboard works standalone out of the box
- **CSV/JSON upload** option to import real results from your Python notebook (scores, SHAP values, metrics, fairness results)
- Config panel to switch between mock and uploaded data

## Navigation
- Sidebar with icons for each section
- Collapsible for presentation mode

