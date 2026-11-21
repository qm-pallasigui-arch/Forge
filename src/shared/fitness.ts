export type ExerciseDef = { id: string; name: string; equipment: string; parts?: string[] };
export type Exercise = {
  id: string;
  name: string;
  equipment: string;
  muscle: string;
  sets: number;
  reps: number;
  weight: number;
  progression: number;
};

export const EXERCISES: Record<string, ExerciseDef[]> = {
  shoulders: [
    {
      id: "overhead-press",
      name: "Overhead Press",
      equipment: "Dumbbells",
      parts: ["front", "side"],
    },
    { id: "lateral-raise", name: "Lateral Raise", equipment: "Dumbbells", parts: ["side"] },
    { id: "front-raise", name: "Front Raise", equipment: "Cable", parts: ["front"] },
    { id: "arnold-press", name: "Arnold Press", equipment: "Dumbbells", parts: ["front", "side"] },
  ],
  chest: [
    { id: "bench-press", name: "Bench Press", equipment: "Barbell" },
    { id: "incline-press", name: "Incline Press", equipment: "Dumbbells" },
    { id: "cable-fly", name: "Cable Fly", equipment: "Cable" },
    { id: "push-up", name: "Push-up", equipment: "Bodyweight" },
  ],
  biceps: [
    { id: "curl", name: "Biceps Curl", equipment: "Dumbbells" },
    { id: "hammer-curl", name: "Hammer Curl", equipment: "Dumbbells" },
    { id: "cable-curl", name: "Cable Curl", equipment: "Cable" },
    { id: "chin-up", name: "Chin-up", equipment: "Bodyweight" },
  ],
  forearms: [
    { id: "wrist-curl", name: "Wrist Curl", equipment: "Dumbbells" },
    { id: "reverse-curl", name: "Reverse Curl", equipment: "Barbell" },
    { id: "farmers-carry", name: "Farmer's Carry", equipment: "Dumbbells" },
    { id: "dead-hang", name: "Dead Hang", equipment: "Pull-up bar" },
  ],
  abs: [
    { id: "crunch", name: "Cable Crunch", equipment: "Cable" },
    { id: "leg-raise", name: "Hanging Leg Raise", equipment: "Pull-up bar" },
    { id: "dead-bug", name: "Dead Bug", equipment: "Bodyweight" },
    { id: "plank", name: "Plank", equipment: "Bodyweight" },
  ],
  obliques: [
    { id: "woodchop", name: "Cable Woodchop", equipment: "Cable" },
    { id: "side-plank", name: "Side Plank", equipment: "Bodyweight" },
    { id: "russian-twist", name: "Russian Twist", equipment: "Medicine ball" },
    { id: "suitcase-carry", name: "Suitcase Carry", equipment: "Dumbbell" },
  ],
  quads: [
    { id: "squat", name: "Back Squat", equipment: "Barbell" },
    { id: "leg-press", name: "Leg Press", equipment: "Machine" },
    { id: "split-squat", name: "Split Squat", equipment: "Dumbbells" },
    { id: "leg-extension", name: "Leg Extension", equipment: "Machine" },
  ],
  calves: [
    {
      id: "calf-raise",
      name: "Standing Calf Raise",
      equipment: "Machine",
      parts: ["gastrocnemius"],
    },
    { id: "seated-calf", name: "Seated Calf Raise", equipment: "Machine", parts: ["soleus"] },
    {
      id: "seated-db-calf",
      name: "Seated Dumbbell Calf Raise",
      equipment: "Dumbbells",
      parts: ["soleus"],
    },
    {
      id: "single-calf",
      name: "Single-leg Calf Raise",
      equipment: "Bodyweight",
      parts: ["gastrocnemius"],
    },
    { id: "jump-rope", name: "Jump Rope", equipment: "Rope" },
  ],
  traps: [
    { id: "shrug", name: "Dumbbell Shrug", equipment: "Dumbbells" },
    { id: "upright-row", name: "Upright Row", equipment: "Cable" },
    { id: "face-pull", name: "Face Pull", equipment: "Cable" },
    { id: "rack-pull", name: "Rack Pull", equipment: "Barbell" },
  ],
  rear_delts: [
    { id: "reverse-fly", name: "Reverse Fly", equipment: "Dumbbells" },
    { id: "rear-delt-row", name: "Rear Delt Row", equipment: "Cable" },
    { id: "face-pull-rear", name: "Face Pull", equipment: "Cable" },
    { id: "band-pull", name: "Band Pull-apart", equipment: "Band" },
  ],
  lats: [
    { id: "pulldown", name: "Lat Pulldown", equipment: "Cable" },
    { id: "pull-up", name: "Pull-up", equipment: "Bodyweight" },
    { id: "row", name: "One-arm Row", equipment: "Dumbbell" },
    { id: "pullover", name: "Cable Pullover", equipment: "Cable" },
  ],
  triceps: [
    { id: "pushdown", name: "Triceps Pushdown", equipment: "Cable" },
    { id: "skull-crusher", name: "Skull Crusher", equipment: "Barbell" },
    { id: "overhead-extension", name: "Overhead Extension", equipment: "Dumbbell" },
    { id: "close-grip", name: "Close-grip Press", equipment: "Barbell" },
  ],
  lower_back: [
    { id: "back-extension", name: "Back Extension", equipment: "Bench" },
    { id: "good-morning", name: "Good Morning", equipment: "Barbell" },
    { id: "bird-dog", name: "Bird Dog", equipment: "Bodyweight" },
    { id: "deadlift", name: "Deadlift", equipment: "Barbell" },
  ],
  glutes: [
    { id: "hip-thrust", name: "Hip Thrust", equipment: "Barbell" },
    { id: "glute-bridge", name: "Glute Bridge", equipment: "Bodyweight" },
    { id: "kickback", name: "Cable Kickback", equipment: "Cable" },
    { id: "step-up", name: "Step-up", equipment: "Dumbbells" },
  ],
  hamstrings: [
    { id: "rdl", name: "Romanian Deadlift", equipment: "Barbell" },
    { id: "leg-curl", name: "Leg Curl", equipment: "Machine" },
    { id: "nordic-curl", name: "Nordic Curl", equipment: "Bodyweight" },
    { id: "single-rdl", name: "Single-leg RDL", equipment: "Dumbbell" },
  ],
};

// Drill-down parts. Exercises without `parts` show under "All" only.
// Marker positions for the 3D model live in BodyViewer3D (PART_POINTS).
export const SUBPARTS: Record<string, { id: string; label: string }[]> = {
  calves: [
    { id: "gastrocnemius", label: "Gastrocnemius" },
    { id: "soleus", label: "Soleus" },
  ],
  shoulders: [
    { id: "front", label: "Front" },
    { id: "side", label: "Side" },
  ],
};
