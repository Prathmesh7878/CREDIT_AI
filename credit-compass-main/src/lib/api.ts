const BASE_URL = "https://risk-engine-qfmz.onrender.com"; // change later to Render URL


export async function scoreBorrower(data: any) {
  const res = await fetch(`${BASE_URL}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("API Error");
  return await res.json();
}
