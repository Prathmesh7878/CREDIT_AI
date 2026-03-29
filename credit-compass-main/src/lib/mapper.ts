export function mapAnswersToPayload(answers: any, age: number) {
  const incomeMap: Record<string, number> = {
    "< ₹15,000": 12000,
    "₹15,000–30,000": 25000,
    "₹30,000–60,000": 45000,
    "₹60,000–1L": 80000,
    "₹1L+": 150000,
  };

  const employmentYearsMap: Record<string, number> = {
    "< 6 months": 0.3,
    "6–12 months": 0.8,
    "1–3 years": 2,
    "3+ years": 5,
  };

  const emiMap: Record<string, number> = {
    "None": 0,
    "< ₹5,000": 3000,
    "₹5,000–15,000": 10000,
    "₹15,000+": 20000,
  };

  const missedMap: Record<string, number> = {
    "Never": 0,
    "1–2 times": 1,
    "3+ times": 3,
  };

  return {
    age: age,
    employment_years: 2,
    monthly_income: 45000,
    loan_amount: 180000,
    monthly_emi: 3000,
    previous_loans: 0,
    overdue_amount: 0,
    late_payment_ratio: 0
  };
}

