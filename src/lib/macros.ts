// Macro calculation utilities
export type Sex = "male" | "female";
export type Goal = "bulk" | "cut" | "maintain";
export type Activity = "sedentary" | "light" | "moderate" | "active" | "veryActive";

const ACT_FACTOR: Record<Activity, number> = {
  sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, veryActive: 1.9,
};

export function calcTargets(input: {
  sex: Sex; age: number; height_cm: number; weight_kg: number; goal: Goal; activity: Activity;
}) {
  const { sex, age, height_cm, weight_kg, goal, activity } = input;
  // Mifflin-St Jeor BMR
  const bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + (sex === "male" ? 5 : -161);
  const tdee = bmr * ACT_FACTOR[activity];
  const adj = goal === "bulk" ? 350 : goal === "cut" ? -450 : 0;
  const calories = Math.round(tdee + adj);
  const protein_g = Math.round(weight_kg * (goal === "cut" ? 2.2 : goal === "bulk" ? 2.0 : 1.8));
  const fat_g = Math.round((calories * 0.25) / 9);
  const carbs_g = Math.max(0, Math.round((calories - protein_g * 4 - fat_g * 9) / 4));
  return { calories, protein_g, carbs_g, fat_g };
}

export const GOAL_LABEL: Record<Goal, string> = { bulk: "Ganhar massa", cut: "Perder gordura", maintain: "Manter forma" };
export const ACT_LABEL: Record<Activity, string> = {
  sedentary: "Sedentário", light: "Leve", moderate: "Moderado", active: "Ativo", veryActive: "Muito ativo",
};
