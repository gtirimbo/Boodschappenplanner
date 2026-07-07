import React, { useState, useMemo } from "react";
import { ShoppingCart, ChevronRight, ChevronLeft, Check, AlertTriangle, Clock, RotateCcw, Flame } from "lucide-react";

// ---------------------------------------------------------------------------
// PRICE DATA — real prices matched from the checkjebon.nl open dataset
// (MIT, github.com/supermarkt/checkjebon), snapshot baked in at build time.
// In the self-hosted version this object is replaced by a fetch to
// /api/prices, which the backend refreshes weekly (see backend/README.md).
// ---------------------------------------------------------------------------
const INGREDIENTS = {
  chicken: { name: "Chicken breast fillets", pack: "500g", ah: 7.69, jumbo: 7.99, lidl: 6.90, plus: 4.79, dirk: 6.63, spar: 6.90, hoogvliet: 6.63, dekamarkt: 7.49 },
  thighs: { name: "Chicken thighs", pack: "500g", ah: 6.50, jumbo: 6.33, lidl: 5.99, plus: 6.15, dirk: 6.23, spar: 8.69, hoogvliet: 7.17, dekamarkt: 5.84 },
  beef: { name: "Minced beef", pack: "500g", ah: 6.49, jumbo: 5.55, lidl: 5.89, plus: 4.49, dirk: 5.89, spar: 6.29, hoogvliet: 4.79, dekamarkt: 6.49 },
  salmon: { name: "Salmon fillet", pack: "300g / 2 fillets", ah: 4.59, jumbo: 7.60, lidl: 4.99, plus: 4.79, dirk: 5.99, spar: 4.99, hoogvliet: 5.99, dekamarkt: 6.12 },
  whitefish: { name: "White fish (pangasius)", pack: "400g", ah: 5.31, jumbo: 3.69, lidl: 4.63, plus: 7.08, dirk: 2.93, spar: 5.25, hoogvliet: 2.93, dekamarkt: 2.93 },
  tuna: { name: "Tuna (can, in water)", pack: "1 can", ah: 1.49, jumbo: 3.99, lidl: 2.79, plus: 2.99, dirk: 2.49, spar: 2.45, hoogvliet: 2.29, dekamarkt: 3.09 },
  tofu: { name: "Tofu", pack: "400g", ah: 3.19, jumbo: 1.55, lidl: 1.44, plus: 1.95, dirk: 1.95, spar: 1.78, hoogvliet: 1.95, dekamarkt: 2.04 },
  eggs: { name: "Eggs", pack: "6-pack", ah: 2.49, jumbo: 2.59, lidl: 1.59, plus: 2.69, dirk: 2.21, spar: 1.85, hoogvliet: 2.73, dekamarkt: 1.79 },
  quark: { name: "Low-fat quark", pack: "500g", ah: 1.49, jumbo: 0.99, lidl: 1.85, plus: 1.49, dirk: 0.99, spar: 1.89, hoogvliet: 0.99, dekamarkt: 0.99 },
  yogurt: { name: "Greek yogurt", pack: "500g", ah: 2.59, jumbo: 1.99, lidl: 1.79, plus: 1.65, dirk: 2.99, spar: 1.89, hoogvliet: 1.52, dekamarkt: 2.89 },
  cottage: { name: "Cottage cheese (hüttenkäse)", pack: "200g", ah: 1.99, jumbo: 1.99, lidl: 0.88, plus: 1.99, dirk: 1.79, spar: 2.25, hoogvliet: 1.89, dekamarkt: 1.95 },
  milk: { name: "Semi-skimmed milk", pack: "1L", ah: 1.29, jumbo: 0.89, lidl: 1.35, plus: 1.49, dirk: 1.39, spar: 1.55, hoogvliet: 1.19, dekamarkt: 1.09 },
  rice: { name: "Rice", pack: "1kg", ah: 1.49, jumbo: 1.49, lidl: 0.87, plus: 1.79, dirk: 1.99, spar: 3.38, hoogvliet: 3.39, dekamarkt: 3.19 },
  pasta: { name: "Pasta", pack: "500g", ah: 0.85, jumbo: 1.29, lidl: 0.77, plus: 0.95, dirk: 1.79, spar: 0.79, hoogvliet: 1.42, dekamarkt: 2.29 },
  wraps: { name: "Wholegrain wraps", pack: "6-pack", ah: 0.95, jumbo: 2.69, lidl: 0.94, plus: 0.86, dirk: 0.81, spar: 1.09, hoogvliet: 2.25, dekamarkt: 0.94 },
  bread: { name: "Wholegrain bread", pack: "1 loaf", ah: 2.69, jumbo: 0.99, lidl: 2.38, plus: 2.46, dirk: 1.79, spar: 2.99, hoogvliet: 1.95, dekamarkt: 0.35 },
  oats: { name: "Oats", pack: "1kg", ah: 1.45, jumbo: 1.45, lidl: 1.48, plus: 1.58, dirk: 4.08, spar: 4.98, hoogvliet: 1.48, dekamarkt: 4.23 },
  couscous: { name: "Couscous", pack: "500g", ah: 1.61, jumbo: 1.74, lidl: 1.79, plus: 2.19, dirk: 1.48, spar: 2.59, hoogvliet: 2.69, dekamarkt: 1.69 },
  lentils: { name: "Lentils (can)", pack: "1 can", ah: 1.09, jumbo: 1.29, lidl: 0.95, plus: 1.09, dirk: 1.21, spar: 3.15, hoogvliet: 1.27, dekamarkt: 1.39 },
  chickpeas: { name: "Chickpeas (can)", pack: "1 can", ah: 0.99, jumbo: 1.08, lidl: 0.90, plus: 1.06, dirk: 0.90, spar: 1.12, hoogvliet: 1.06, dekamarkt: 1.39 },
  blackbeans: { name: "Black beans (can)", pack: "1 can", ah: 0.99, jumbo: 0.95, lidl: 1.49, plus: 1.75, dirk: 1.93, spar: 1.05, hoogvliet: 1.93, dekamarkt: 1.09 },
  kidney: { name: "Kidney beans (can)", pack: "1 can", ah: 0.65, jumbo: 0.85, lidl: 0.64, plus: 0.58, dirk: 0.61, spar: 1.53, hoogvliet: 0.56, dekamarkt: 0.58 },
  broccoli: { name: "Broccoli", pack: "1 piece", ah: 1.05, jumbo: 1.35, lidl: 2.29, plus: 1.49, dirk: 1.98, spar: 1.55, hoogvliet: 2.95, dekamarkt: 2.50 },
  pepper: { name: "Bell pepper", pack: "1 piece", ah: 0.79, jumbo: 1.09, lidl: 0.95, plus: 0.75, dirk: 0.59, spar: 1.09, hoogvliet: 1.39, dekamarkt: 0.79 },
  onion: { name: "Onion", pack: "1 piece", ah: 0.99, jumbo: 0.89, lidl: 0.99, plus: 1.89, dirk: 0.98, spar: 2.25, hoogvliet: 2.18, dekamarkt: 0.89 },
  garlic: { name: "Garlic bulb", pack: "1 bulb", ah: 1.29, jumbo: 1.29, lidl: 0.69, plus: 2.09, dirk: 1.49, spar: 3.99, hoogvliet: 2.99, dekamarkt: 1.99 },
  tomato: { name: "Tomatoes", pack: "500g", ah: 2.75, jumbo: 4.32, lidl: 2.69, plus: 1.19, dirk: 2.49, spar: 2.99, hoogvliet: 1.39, dekamarkt: 2.69 },
  passata: { name: "Tomato passata", pack: "500g", ah: 0.79, jumbo: 0.75, lidl: 1.78, plus: 0.89, dirk: 0.78, spar: 1.70, hoogvliet: 1.79, dekamarkt: 2.44 },
  spinach: { name: "Spinach", pack: "300g", ah: 2.35, jumbo: 2.39, lidl: 1.53, plus: 4.99, dirk: 0.99, spar: 1.95, hoogvliet: 4.89, dekamarkt: 2.38 },
  zucchini: { name: "Zucchini (courgette)", pack: "1 piece", ah: 0.65, jumbo: 0.95, lidl: 0.49, plus: 0.75, dirk: 0.55, spar: 0.95, hoogvliet: 1.05, dekamarkt: 0.59 },
  mushrooms: { name: "Mushrooms", pack: "250g", ah: 1.09, jumbo: 3.01, lidl: 0.98, plus: 1.25, dirk: 1.99, spar: 1.15, hoogvliet: 1.29, dekamarkt: 1.05 },
  carrot: { name: "Carrots", pack: "1kg bag", ah: 1.05, jumbo: 1.99, lidl: 0.35, plus: 1.75, dirk: 0.98, spar: 1.55, hoogvliet: 1.69, dekamarkt: 0.99 },
  cucumber: { name: "Cucumber", pack: "1 piece", ah: 0.85, jumbo: 0.89, lidl: 0.79, plus: 0.85, dirk: 0.79, spar: 0.89, hoogvliet: 0.85, dekamarkt: 0.79 },
  cheese: { name: "Cheese (Goudse, block)", pack: "400g", ah: 5.07, jumbo: 3.83, lidl: 4.49, plus: 5.24, dirk: 4.57, spar: 7.56, hoogvliet: 4.28, dekamarkt: 4.40 },
  feta: { name: "Feta / white cheese", pack: "200g", ah: 2.35, jumbo: 2.09, lidl: 2.29, plus: 2.29, dirk: 2.29, spar: 4.92, hoogvliet: 2.35, dekamarkt: 2.35 },
  oil: { name: "Olive oil", pack: "500ml", ah: 4.34, jumbo: 5.29, lidl: 2.99, plus: 9.29, dirk: 5.49, spar: 4.09, hoogvliet: 4.84, dekamarkt: 6.39 },
  spices: { name: "Mixed herbs & spices", pack: "jar", ah: 1.69, jumbo: 1.99, lidl: 1.49, plus: 1.09, dirk: 2.45, spar: 3.45, hoogvliet: 2.93, dekamarkt: 2.79 },
  lemon: { name: "Lemon", pack: "1 piece", ah: 1.99, jumbo: 2.39, lidl: 1.49, plus: 1.69, dirk: 1.25, spar: 1.99, hoogvliet: 1.39, dekamarkt: 1.89 },
  potato: { name: "Potatoes", pack: "2kg bag", ah: 3.30, jumbo: 2.95, lidl: 2.93, plus: 3.79, dirk: 3.96, spar: 0.99, hoogvliet: 4.60, dekamarkt: 3.32 },
  sweetpotato: { name: "Sweet potatoes", pack: "1kg", ah: 3.29, jumbo: 4.65, lidl: 1.79, plus: 2.78, dirk: 2.38, spar: 3.59, hoogvliet: 2.90, dekamarkt: 2.78 },
  curry: { name: "Curry paste", pack: "jar", ah: 3.49, jumbo: 3.49, lidl: 0.99, plus: 3.29, dirk: 3.35, spar: 3.89, hoogvliet: 3.12, dekamarkt: 3.35 },
  coconut: { name: "Coconut milk (can)", pack: "1 can", ah: 2.39, jumbo: 2.23, lidl: 2.29, plus: 1.28, dirk: 2.49, spar: 2.79, hoogvliet: 4.24, dekamarkt: 2.49 },
  avocado: { name: "Avocado", pack: "1 piece", ah: 1.35, jumbo: 1.39, lidl: 1.29, plus: 2.49, dirk: 1.19, spar: 1.55, hoogvliet: 1.35, dekamarkt: 1.29 },
  almonds: { name: "Almonds", pack: "200g", ah: 2.29, jumbo: 2.65, lidl: 2.49, plus: 4.89, dirk: 5.49, spar: 4.13, hoogvliet: 6.15, dekamarkt: 4.95 },
  peanutbutter: { name: "Peanut butter", pack: "350g jar", ah: 3.49, jumbo: 1.19, lidl: 1.99, plus: 2.19, dirk: 2.89, spar: 1.99, hoogvliet: 1.55, dekamarkt: 2.95 },
  banana: { name: "Bananas", pack: "1kg", ah: 1.35, jumbo: 2.46, lidl: 1.65, plus: 2.19, dirk: 1.29, spar: 0.46, hoogvliet: 1.79, dekamarkt: 1.99 },
};

// Macros are approximate values PER SERVING (1 person).
// Ingredient fractions are the share of one pack used per serving.
const STORES = [
  { id: "ah",        name: "Albert Heijn", accent: "#00A0E2", text: "#FFF" },
  { id: "jumbo",     name: "Jumbo",        accent: "#F5C400", text: "#15161B" },
  { id: "lidl",      name: "Lidl",         accent: "#D91E2B", text: "#FFF" },
  { id: "plus",      name: "PLUS",         accent: "#5DA33A", text: "#FFF" },
  { id: "dirk",      name: "Dirk",         accent: "#8C1218", text: "#FFF" },
  { id: "spar",      name: "SPAR",         accent: "#0B5C33", text: "#FFF" },
  { id: "hoogvliet", name: "Hoogvliet",    accent: "#E17000", text: "#FFF" },
  { id: "dekamarkt", name: "DekaMarkt",    accent: "#1449C4", text: "#FFF" },
];

const RECIPES = [
  // =============== BASIC HEALTHY — BREAKFAST ===============
  { id: "b_oatmeal", diet: "basic", meal: "breakfast", name: "Banana Peanut Oatmeal", time: "10 min",
    macros: { kcal: 380, protein: 12, carbs: 58, fat: 11 },
    ingredients: { oats: 0.06, milk: 0.25, banana: 0.12, peanutbutter: 0.03 },
    steps: [
      "Pour 250 ml milk into a small pan and bring to a gentle simmer over medium heat.",
      "Stir in 60 g oats and a pinch of salt.",
      "Cook 4–5 minutes, stirring regularly, until thick and creamy.",
      "Pour into a bowl, top with half a sliced banana.",
      "Swirl 1 heaped tsp peanut butter through and serve warm." ] },
  { id: "b_yogurtbowl", diet: "basic", meal: "breakfast", name: "Greek Yogurt & Oat Bowl", time: "5 min",
    macros: { kcal: 350, protein: 20, carbs: 40, fat: 12 },
    ingredients: { yogurt: 0.3, oats: 0.04, banana: 0.12, almonds: 0.05 },
    steps: [
      "Spoon 150 g Greek yogurt into a bowl.",
      "Stir in 40 g oats — raw is fine, they soften in a minute or two.",
      "Slice half a banana over the top.",
      "Roughly chop 10 g almonds and scatter over. Done." ] },
  { id: "b_scramble", diet: "basic", meal: "breakfast", name: "Scrambled Eggs on Toast", time: "10 min",
    macros: { kcal: 360, protein: 22, carbs: 28, fat: 17 },
    ingredients: { eggs: 0.34, bread: 0.2, tomato: 0.2, oil: 0.02 },
    steps: [
      "Toast 2 slices of wholegrain bread.",
      "Whisk 2 eggs with a pinch of salt and pepper.",
      "Heat 1 tsp olive oil in a nonstick pan over medium-low heat.",
      "Pour in the eggs and stir slowly with a spatula for 2–3 minutes until just set — take them off while still glossy.",
      "Pile onto the toast with a sliced tomato on the side." ] },
  { id: "b_avotoast", diet: "basic", meal: "breakfast", name: "Avocado Toast with Egg", time: "12 min",
    macros: { kcal: 420, protein: 16, carbs: 34, fat: 25 },
    ingredients: { bread: 0.2, avocado: 1, eggs: 0.17, lemon: 0.3 },
    steps: [
      "Bring a small pan of water to a boil, lower in 1 egg and cook 7 minutes for a jammy yolk. Cool under cold water and peel.",
      "Meanwhile toast 2 slices of bread.",
      "Halve the avocado, scoop into a bowl, mash with a squeeze of lemon, salt and pepper.",
      "Spread the avocado on the toast and top with the halved egg." ] },
  { id: "b_overnight", diet: "basic", meal: "breakfast", name: "Overnight Quark Oats", time: "5 min (+ overnight)",
    macros: { kcal: 340, protein: 24, carbs: 44, fat: 6 },
    ingredients: { quark: 0.3, oats: 0.05, milk: 0.1, banana: 0.12 },
    steps: [
      "The evening before: mix 150 g quark, 50 g oats and 100 ml milk in a jar or bowl.",
      "Cover and refrigerate overnight.",
      "In the morning, loosen with a splash of milk if needed.",
      "Top with half a sliced banana." ] },

  // =============== BASIC HEALTHY — LUNCH ===============
  { id: "l_tunasand", diet: "basic", meal: "lunch", name: "Tuna Salad Sandwich", time: "10 min",
    macros: { kcal: 420, protein: 30, carbs: 40, fat: 14 },
    ingredients: { tuna: 1, bread: 0.3, cucumber: 0.3, yogurt: 0.1, onion: 0.5 },
    steps: [
      "Drain 1 can of tuna well and flake into a bowl.",
      "Mix in 50 g Greek yogurt, a quarter of a finely diced onion, salt and pepper.",
      "Slice a third of a cucumber thinly.",
      "Layer tuna mix and cucumber between 3 slices of bread (or 2 thick ones). Cut in half." ] },
  { id: "l_chickpeawrap", diet: "basic", meal: "lunch", name: "Smashed Chickpea Wraps", time: "15 min",
    macros: { kcal: 450, protein: 15, carbs: 62, fat: 16 },
    ingredients: { chickpeas: 1, wraps: 0.34, lemon: 0.3, garlic: 0.2, cucumber: 0.3, oil: 0.03 },
    steps: [
      "Drain 1 can chickpeas, keep a spoonful of the liquid.",
      "Mash with a fork together with 1 tbsp olive oil, juice of half a lemon, 1 grated garlic clove, salt and pepper — leave it chunky.",
      "Slice a third of a cucumber into ribbons or thin rounds.",
      "Warm 2 wraps in a dry pan, 20 seconds per side.",
      "Fill with the chickpea smash and cucumber, roll up tightly." ] },
  { id: "l_couscousbowl", diet: "basic", meal: "lunch", name: "Couscous Bowl with Feta", time: "20 min",
    macros: { kcal: 530, protein: 18, carbs: 72, fat: 19 },
    ingredients: { couscous: 0.16, zucchini: 1, pepper: 1, feta: 0.5, lemon: 0.5, oil: 0.05 },
    steps: [
      "Put 80 g couscous in a bowl, pour over 100 ml boiling water, cover with a plate and leave 5 minutes.",
      "Dice 1 zucchini and 1 bell pepper. Fry in 1 tbsp olive oil over high heat, 6–8 minutes, until charred at the edges.",
      "Fluff the couscous with a fork.",
      "Fold in the vegetables, crumble over 100 g feta.",
      "Dress with the juice of half a lemon, salt and pepper." ] },
  { id: "l_lentilsoup", diet: "basic", meal: "lunch", name: "Lentil & Carrot Soup", time: "30 min",
    macros: { kcal: 420, protein: 21, carbs: 66, fat: 8 },
    ingredients: { lentils: 1, carrot: 0.2, onion: 1, garlic: 0.3, passata: 0.4, bread: 0.2 },
    steps: [
      "Dice 1 onion and 2 carrots; crush 2 garlic cloves.",
      "Sauté in a splash of oil over medium heat for 5 minutes.",
      "Add 1 drained can of lentils, 200 g passata and 400 ml water.",
      "Simmer 20 minutes, then blend half the soup (or leave chunky).",
      "Season and serve with 2 slices of bread." ] },
  { id: "l_minestrone", diet: "basic", meal: "lunch", name: "Minestrone-style Soup", time: "30 min",
    macros: { kcal: 450, protein: 20, carbs: 80, fat: 6 },
    ingredients: { passata: 0.7, carrot: 0.2, onion: 1, garlic: 0.3, pasta: 0.15, blackbeans: 1 },
    steps: [
      "Dice 1 onion and 2 carrots; crush 2 garlic cloves. Sauté 5 minutes in a large pan.",
      "Add 350 g passata, 1 drained can black beans and 500 ml water. Bring to a boil.",
      "Add 75 g small pasta and simmer 10 minutes until the pasta is tender.",
      "Season generously with salt, pepper and dried herbs." ] },
  { id: "l_eggsand", diet: "basic", meal: "lunch", name: "Egg & Tomato Sandwich", time: "12 min",
    macros: { kcal: 390, protein: 20, carbs: 38, fat: 17 },
    ingredients: { eggs: 0.34, bread: 0.3, tomato: 0.3, yogurt: 0.05 },
    steps: [
      "Boil 2 eggs for 9 minutes, cool under cold water and peel.",
      "Mash the eggs with 1 tbsp Greek yogurt, salt and pepper.",
      "Slice 1 tomato.",
      "Build the sandwich with 3 slices of bread, egg mash and tomato." ] },

  // =============== BASIC HEALTHY — DINNER ===============
  { id: "d_primavera", diet: "basic", meal: "dinner", name: "Veggie Pasta Primavera", time: "25 min",
    macros: { kcal: 520, protein: 19, carbs: 78, fat: 15 },
    ingredients: { pasta: 0.25, broccoli: 1, pepper: 1, onion: 1, garlic: 0.3, tomato: 0.5, oil: 0.05, cheese: 0.1 },
    steps: [
      "Boil 125 g pasta in salted water until al dente; keep a cup of pasta water.",
      "Cut 1 broccoli into small florets, dice 1 pepper and 1 onion, crush 2 garlic cloves.",
      "Fry the vegetables in 1 tbsp olive oil over medium-high heat for 6–7 minutes.",
      "Add 250 g chopped tomatoes and cook 3 minutes more.",
      "Toss in the pasta with a splash of pasta water, season, and grate 40 g cheese over." ] },
  { id: "d_stirfry", diet: "basic", meal: "dinner", name: "Chicken Stir-fry with Rice", time: "25 min",
    macros: { kcal: 560, protein: 42, carbs: 62, fat: 14 },
    ingredients: { chicken: 0.4, rice: 0.08, pepper: 1, onion: 1, garlic: 0.3, carrot: 0.2, oil: 0.05 },
    steps: [
      "Cook 80 g rice according to the pack.",
      "Slice 200 g chicken breast into strips; season with salt and pepper.",
      "Heat 1 tbsp oil in a wok over high heat, fry the chicken 4–5 minutes until golden. Set aside.",
      "Stir-fry 1 sliced pepper, 1 sliced onion, 1 julienned carrot and 2 crushed garlic cloves for 4 minutes.",
      "Return the chicken, toss 1 minute, and serve over the rice." ] },
  { id: "d_chickpeacurry", diet: "basic", meal: "dinner", name: "Chickpea & Spinach Curry", time: "30 min",
    macros: { kcal: 610, protein: 20, carbs: 74, fat: 26 },
    ingredients: { chickpeas: 1, spinach: 0.7, onion: 1, garlic: 0.3, curry: 0.2, coconut: 1, rice: 0.08 },
    steps: [
      "Cook 80 g rice according to the pack.",
      "Fry 1 diced onion and 2 crushed garlic cloves in a splash of oil for 4 minutes.",
      "Stir in 2 tbsp curry paste and cook 1 minute until fragrant.",
      "Add 1 drained can chickpeas and 1 can coconut milk; simmer 10 minutes.",
      "Fold in 200 g spinach until wilted. Season and serve over the rice." ] },
  { id: "d_bakedsalmon", diet: "basic", meal: "dinner", name: "Baked Salmon & Potatoes", time: "35 min",
    macros: { kcal: 580, protein: 36, carbs: 46, fat: 26 },
    ingredients: { salmon: 0.5, potato: 0.15, broccoli: 1, lemon: 0.5, oil: 0.05 },
    steps: [
      "Heat the oven to 200°C. Cut 300 g potatoes into 2 cm chunks.",
      "Toss the potatoes with 1 tbsp olive oil and salt on a baking tray; roast 20 minutes.",
      "Push the potatoes aside, add 1 salmon fillet and 1 broccoli cut into florets.",
      "Drizzle with a little oil and roast another 12–15 minutes until the salmon flakes.",
      "Squeeze half a lemon over everything before serving." ] },
  { id: "d_beanstew", diet: "basic", meal: "dinner", name: "Bean & Vegetable Stew", time: "35 min",
    macros: { kcal: 480, protein: 22, carbs: 88, fat: 5 },
    ingredients: { kidney: 1, passata: 0.6, onion: 1, garlic: 0.3, potato: 0.15, carrot: 0.2 },
    steps: [
      "Dice 1 onion, 2 carrots and 300 g potatoes; crush 2 garlic cloves.",
      "Sauté the onion and garlic 4 minutes, then add carrot and potato.",
      "Add 300 g passata, 1 drained can kidney beans and 300 ml water.",
      "Simmer covered 20–25 minutes until the potatoes are tender.",
      "Season with salt, pepper and dried herbs — paprika works well here." ] },
  { id: "d_tomatorice", diet: "basic", meal: "dinner", name: "Tomato Rice with Avocado", time: "20 min",
    macros: { kcal: 540, protein: 10, carbs: 82, fat: 20 },
    ingredients: { rice: 0.1, tomato: 0.5, avocado: 1, onion: 1, garlic: 0.3, oil: 0.05 },
    steps: [
      "Fry 1 diced onion and 2 crushed garlic cloves in 1 tbsp olive oil for 4 minutes.",
      "Add 250 g chopped tomatoes and cook down 3 minutes.",
      "Stir in 100 g rice and 250 ml water; cover and simmer 14 minutes on low.",
      "Rest 5 minutes off the heat, then fluff.",
      "Top with 1 sliced avocado, flaky salt and pepper." ] },
  { id: "d_mushroompasta", diet: "basic", meal: "dinner", name: "Creamy Mushroom Pasta", time: "25 min",
    macros: { kcal: 550, protein: 22, carbs: 74, fat: 18 },
    ingredients: { pasta: 0.25, mushrooms: 1, onion: 1, garlic: 0.3, quark: 0.2, cheese: 0.08 },
    steps: [
      "Boil 125 g pasta; save a cup of pasta water before draining.",
      "Slice 250 g mushrooms and 1 onion; crush 2 garlic cloves.",
      "Fry the mushrooms in a hot dry pan 5 minutes until browned, then add a knob of oil, the onion and garlic for 3 more.",
      "Take the pan off the heat, stir in 100 g quark and a splash of pasta water to make a sauce.",
      "Toss with the pasta, season, and finish with 30 g grated cheese." ] },
  { id: "d_fishwraps", diet: "basic", meal: "dinner", name: "White Fish & Veg Wraps", time: "25 min",
    macros: { kcal: 500, protein: 34, carbs: 52, fat: 16 },
    ingredients: { whitefish: 0.5, wraps: 0.34, cucumber: 0.3, tomato: 0.3, yogurt: 0.1, spices: 0.05 },
    steps: [
      "Season 200 g white fish with paprika, salt and pepper.",
      "Pan-fry in a little oil, 3–4 minutes per side, then flake with a fork.",
      "Mix 50 g Greek yogurt with a pinch of the same spices for a quick sauce.",
      "Slice a third of a cucumber and 1 tomato.",
      "Warm 2 wraps, fill with fish, vegetables and sauce, and roll." ] },

  // =============== HIGH PROTEIN — BREAKFAST ===============
  { id: "pb_quarkbowl", diet: "protein", meal: "breakfast", name: "Almond Quark Protein Bowl", time: "5 min",
    macros: { kcal: 480, protein: 42, carbs: 32, fat: 20 },
    ingredients: { quark: 0.5, almonds: 0.15, oats: 0.05, banana: 0.12 },
    steps: [
      "Spoon 250 g quark into a bowl.",
      "Stir in 50 g oats.",
      "Slice half a banana over the top.",
      "Roughly chop 30 g almonds and scatter over." ] },
  { id: "pb_cottagetoast", diet: "protein", meal: "breakfast", name: "Cottage Cheese Scramble on Toast", time: "12 min",
    macros: { kcal: 430, protein: 34, carbs: 30, fat: 19 },
    ingredients: { eggs: 0.5, cottage: 0.5, bread: 0.2, oil: 0.02 },
    steps: [
      "Toast 2 slices of bread.",
      "Whisk 3 eggs with pepper (go easy on salt — the cottage cheese has some).",
      "Scramble in 1 tsp oil over low heat, stirring, about 3 minutes.",
      "Just before the eggs set, fold in 100 g cottage cheese and take off the heat.",
      "Serve on the toast." ] },
  { id: "pb_yogurtpower", diet: "protein", meal: "breakfast", name: "Greek Yogurt Power Bowl", time: "5 min",
    macros: { kcal: 400, protein: 30, carbs: 38, fat: 13 },
    ingredients: { yogurt: 0.4, oats: 0.05, almonds: 0.07, banana: 0.12 },
    steps: [
      "Spoon 200 g Greek yogurt into a bowl.",
      "Stir in 50 g oats.",
      "Top with half a sliced banana and 15 g chopped almonds." ] },
  { id: "pb_omelette", diet: "protein", meal: "breakfast", name: "Spinach & Cheese Omelette", time: "12 min",
    macros: { kcal: 420, protein: 30, carbs: 8, fat: 29 },
    ingredients: { eggs: 0.5, spinach: 0.3, cheese: 0.08, oil: 0.02 },
    steps: [
      "Whisk 3 eggs with salt and pepper.",
      "Wilt 100 g spinach in a nonstick pan with 1 tsp oil, 1–2 minutes. Set aside and wipe the pan.",
      "Pour in the eggs over medium-low heat; as they set, drag the edges inward.",
      "When nearly set, scatter the spinach and 30 g grated cheese over one half.",
      "Fold, slide onto a plate, and eat immediately." ] },
  { id: "pb_beanskillet", diet: "protein", meal: "breakfast", name: "Eggs & Beans Breakfast Skillet", time: "15 min",
    macros: { kcal: 470, protein: 31, carbs: 44, fat: 17 },
    ingredients: { eggs: 0.34, blackbeans: 1, tomato: 0.3, bread: 0.2 },
    steps: [
      "Warm 1 drained can of black beans in a small pan with 150 g chopped tomato and a pinch of paprika, 5 minutes.",
      "Make two wells in the beans and crack in 2 eggs.",
      "Cover and cook 4–5 minutes until the whites are set but the yolks are still soft.",
      "Serve straight from the pan with 2 slices of toasted bread." ] },

  // =============== HIGH PROTEIN — LUNCH ===============
  { id: "pl_tunawraps", diet: "protein", meal: "lunch", name: "Tuna & Cottage Cheese Wraps", time: "15 min",
    macros: { kcal: 520, protein: 46, carbs: 50, fat: 14 },
    ingredients: { tuna: 1.5, cottage: 1, wraps: 0.34, cucumber: 0.3, tomato: 0.3 },
    steps: [
      "Drain 1½ cans of tuna and mix with 200 g cottage cheese, pepper and a pinch of salt.",
      "Slice a third of a cucumber and 1 tomato.",
      "Warm 2 wraps in a dry pan, 20 seconds per side.",
      "Divide the tuna mix and vegetables over the wraps and roll up tightly." ] },
  { id: "pl_chickencous", diet: "protein", meal: "lunch", name: "Chicken Couscous Salad", time: "20 min",
    macros: { kcal: 520, protein: 42, carbs: 54, fat: 13 },
    ingredients: { chicken: 0.3, couscous: 0.12, cucumber: 0.5, tomato: 0.3, lemon: 0.3, oil: 0.03 },
    steps: [
      "Soak 60 g couscous in 75 ml boiling water, covered, 5 minutes; fluff with a fork.",
      "Season 150 g chicken breast, pan-fry 5–6 minutes per side over medium heat until cooked through. Rest 2 minutes, then slice.",
      "Dice half a cucumber and 1 tomato.",
      "Toss everything with 1 tbsp olive oil, the juice of half a lemon, salt and pepper." ] },
  { id: "pl_tunapasta", diet: "protein", meal: "lunch", name: "Tuna Pasta Salad", time: "20 min",
    macros: { kcal: 540, protein: 38, carbs: 62, fat: 12 },
    ingredients: { tuna: 1.5, pasta: 0.2, pepper: 1, yogurt: 0.15, onion: 0.5 },
    steps: [
      "Boil 100 g pasta, drain and rinse briefly under cold water.",
      "Drain 1½ cans of tuna. Dice 1 bell pepper and a quarter of an onion.",
      "Mix 75 g Greek yogurt with salt, pepper and a little mustard or lemon if you have it.",
      "Combine pasta, tuna, vegetables and dressing. Eat now or box it for later — it keeps a day in the fridge." ] },
  { id: "pl_eggsalad", diet: "protein", meal: "lunch", name: "Egg Salad Sandwich", time: "12 min",
    macros: { kcal: 450, protein: 28, carbs: 36, fat: 21 },
    ingredients: { eggs: 0.5, bread: 0.3, yogurt: 0.1, cucumber: 0.3 },
    steps: [
      "Boil 3 eggs for 9 minutes, cool under cold water and peel.",
      "Mash with 50 g Greek yogurt, salt and plenty of pepper.",
      "Slice a third of a cucumber.",
      "Build the sandwich with 3 slices of bread, the egg salad and cucumber." ] },
  { id: "pl_quarkwrap", diet: "protein", meal: "lunch", name: "Chicken & Quark Wraps", time: "15 min",
    macros: { kcal: 480, protein: 44, carbs: 44, fat: 12 },
    ingredients: { chicken: 0.3, wraps: 0.34, quark: 0.15, spinach: 0.3, tomato: 0.2 },
    steps: [
      "Slice 150 g chicken breast into strips, season, and pan-fry 5–6 minutes until golden and cooked through.",
      "Season 75 g quark with salt, pepper and herbs to make a spread.",
      "Warm 2 wraps, spread with the quark.",
      "Top with a handful of spinach, the chicken and some diced tomato; roll up." ] },
  { id: "pl_lentilsalad", diet: "protein", meal: "lunch", name: "Warm Lentil & Feta Salad", time: "15 min",
    macros: { kcal: 470, protein: 27, carbs: 48, fat: 18 },
    ingredients: { lentils: 1, feta: 0.5, tomato: 0.3, onion: 0.5, oil: 0.03, lemon: 0.3 },
    steps: [
      "Fry a quarter of a diced onion in 1 tbsp olive oil for 3 minutes.",
      "Add 1 drained can of lentils and warm through, 3–4 minutes.",
      "Take off the heat, stir in 150 g diced tomato and the juice of half a lemon.",
      "Crumble 100 g feta over the top and season with pepper." ] },

  // =============== HIGH PROTEIN — DINNER ===============
  { id: "pd_grilledchicken", diet: "protein", meal: "dinner", name: "Grilled Chicken, Rice & Broccoli", time: "25 min",
    macros: { kcal: 620, protein: 55, carbs: 58, fat: 16 },
    ingredients: { chicken: 0.5, rice: 0.09, broccoli: 1, oil: 0.05, garlic: 0.3 },
    steps: [
      "Cook 90 g rice according to the pack.",
      "Butterfly 250 g chicken breast and rub with 1 tbsp oil, 2 crushed garlic cloves, salt and paprika.",
      "Grill or pan-fry over medium-high heat, 5–6 minutes per side, until cooked through (no pink inside). Rest 3 minutes.",
      "Meanwhile steam 1 broccoli cut into florets, 5 minutes.",
      "Slice the chicken and serve over the rice with the broccoli." ] },
  { id: "pd_bolognese", diet: "protein", meal: "dinner", name: "High-Protein Bolognese", time: "30 min",
    macros: { kcal: 680, protein: 44, carbs: 70, fat: 24 },
    ingredients: { beef: 0.4, pasta: 0.25, passata: 0.6, onion: 1, garlic: 0.3, cheese: 0.1 },
    steps: [
      "Brown 200 g minced beef in a hot pan, breaking it up, 5 minutes.",
      "Add 1 diced onion and 2 crushed garlic cloves; cook 3 minutes.",
      "Pour in 300 g passata, season with salt, pepper and dried herbs; simmer 15 minutes.",
      "Meanwhile boil 125 g pasta until al dente.",
      "Serve the sauce over the pasta with 40 g grated cheese." ] },
  { id: "pd_salmonspinach", diet: "protein", meal: "dinner", name: "Salmon & Spinach with Potatoes", time: "30 min",
    macros: { kcal: 590, protein: 38, carbs: 44, fat: 28 },
    ingredients: { salmon: 0.5, spinach: 0.7, potato: 0.15, lemon: 0.5, oil: 0.05 },
    steps: [
      "Boil 300 g potatoes in salted water, 15–18 minutes, until tender.",
      "Pat 1 salmon fillet dry and season the skin side with salt.",
      "Fry skin-side down in 1 tbsp oil over medium heat, 4 minutes; flip for 2–3 more.",
      "Remove the salmon, wilt 200 g spinach in the same pan, 1–2 minutes.",
      "Plate everything and squeeze half a lemon over." ] },
  { id: "pd_tofustir", diet: "protein", meal: "dinner", name: "Tofu Power Stir-fry", time: "25 min",
    macros: { kcal: 540, protein: 32, carbs: 60, fat: 18 },
    ingredients: { tofu: 0.9, pepper: 1, broccoli: 1, carrot: 0.2, rice: 0.09, garlic: 0.3 },
    steps: [
      "Cook 90 g rice. Press 350 g tofu between paper towels, then cube it.",
      "Fry the tofu in a hot oiled wok, 6–7 minutes, turning until golden on most sides. Set aside.",
      "Stir-fry 1 sliced pepper, 1 broccoli in small florets, 1 julienned carrot and 2 crushed garlic cloves, 5 minutes.",
      "Return the tofu, season with salt, pepper and a splash of soy sauce if you have it.",
      "Serve over the rice." ] },
  { id: "pd_chili", diet: "protein", meal: "dinner", name: "Beef & Bean Chili", time: "35 min",
    macros: { kcal: 640, protein: 45, carbs: 54, fat: 26 },
    ingredients: { beef: 0.4, kidney: 1, passata: 0.6, onion: 1, garlic: 0.3, pepper: 1 },
    steps: [
      "Brown 200 g minced beef in a large pan, 5 minutes.",
      "Add 1 diced onion, 1 diced pepper and 2 crushed garlic cloves; cook 4 minutes.",
      "Stir in paprika and (if you like) chili flakes or cumin.",
      "Add 300 g passata and 1 drained can kidney beans; simmer 20 minutes, stirring now and then.",
      "Season and serve — with rice or bread if you have leftovers from other meals." ] },
  { id: "pd_thighstray", diet: "protein", meal: "dinner", name: "Chicken Thigh Traybake", time: "45 min",
    macros: { kcal: 650, protein: 48, carbs: 52, fat: 28 },
    ingredients: { thighs: 0.5, sweetpotato: 0.5, pepper: 1, onion: 1, oil: 0.05, spices: 0.1 },
    steps: [
      "Heat the oven to 200°C.",
      "Cut 500 g sweet potato into wedges, 1 pepper into strips and 1 onion into chunks.",
      "Toss everything plus 250 g chicken thighs with 1 tbsp oil, salt, pepper and paprika on a large tray.",
      "Roast 35 minutes, turning halfway, until the chicken reaches at least 75°C inside and the edges are caramelized." ] },
  { id: "pd_lentilbeef", diet: "protein", meal: "dinner", name: "Beef & Lentil Skillet", time: "30 min",
    macros: { kcal: 630, protein: 50, carbs: 52, fat: 24 },
    ingredients: { beef: 0.3, lentils: 1, onion: 1, garlic: 0.3, passata: 0.5, spinach: 0.4 },
    steps: [
      "Brown 150 g minced beef with 1 diced onion and 2 crushed garlic cloves, 6 minutes.",
      "Add 1 drained can lentils and 250 g passata.",
      "Simmer 10 minutes until thick and glossy.",
      "Fold in 120 g spinach until wilted; season well." ] },
  { id: "pd_eggfriedrice", diet: "protein", meal: "dinner", name: "Chicken & Egg Fried Rice", time: "25 min",
    macros: { kcal: 610, protein: 47, carbs: 64, fat: 18 },
    ingredients: { chicken: 0.3, eggs: 0.34, rice: 0.09, carrot: 0.2, onion: 1, garlic: 0.3, oil: 0.05 },
    steps: [
      "Cook 90 g rice, spread on a plate and let it cool 10 minutes (day-old rice is even better).",
      "Dice 150 g chicken breast, fry in 1 tbsp oil over high heat 5 minutes; push to one side.",
      "Crack in 2 eggs and scramble on the empty side of the pan.",
      "Add 1 diced onion, 1 diced carrot and 2 crushed garlic cloves; stir-fry 3 minutes.",
      "Add the rice, toss everything on high heat 2 minutes, season with salt, pepper (and soy sauce if you have it)." ] },
];

const DAYS = [
  { key: "mo", label: "Mo", full: "Monday" },
  { key: "tu", label: "Tu", full: "Tuesday" },
  { key: "we", label: "We", full: "Wednesday" },
  { key: "th", label: "Th", full: "Thursday" },
  { key: "fr", label: "Fr", full: "Friday" },
  { key: "sa", label: "Sa", full: "Saturday" },
  { key: "su", label: "Su", full: "Sunday" },
];

const MEALS = [
  { key: "breakfast", label: "Breakfast", color: "#1449C4", text: "#FFF" },
  { key: "lunch", label: "Lunch", color: "#F5C400", text: "#15161B" },
  { key: "dinner", label: "Dinner", color: "#D91E2B", text: "#FFF" },
];

const COLORS = {
  bg: "#F7F5EF", ink: "#15161B", blue: "#1449C4", red: "#D91E2B",
  yellow: "#F5C400", grey: "#8A8D94",
};

const price = (id, market) => INGREDIENTS[id][market];
const recipeCost = (r, market) =>
  Object.entries(r.ingredients).reduce((s, [id, f]) => s + f * price(id, market), 0);

// pick numDays recipes per meal type, cheapest first, cycling for variety
function pickMealPlan(diet, numDays, market) {
  const plan = {};
  MEALS.forEach(({ key }) => {
    const sorted = RECIPES.filter((r) => r.diet === diet && r.meal === key)
      .sort((a, b) => recipeCost(a, market) - recipeCost(b, market));
    const picks = [];
    for (let i = 0; i < numDays; i++) {
      const lap = Math.floor(i / sorted.length);
      picks.push(sorted[(i + lap) % sorted.length]);
    }
    plan[key] = picks;
  });
  return plan;
}

function buildShoppingList(allPicks, market) {
  const totals = {};
  allPicks.forEach((r) =>
    Object.entries(r.ingredients).forEach(([id, f]) => (totals[id] = (totals[id] || 0) + f))
  );
  const items = Object.entries(totals)
    .map(([id, f]) => {
      const packs = Math.ceil(f - 1e-9);
      return { id, name: INGREDIENTS[id].name, pack: INGREDIENTS[id].pack, packs, lineTotal: packs * price(id, market) };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
  return { items, grandTotal: items.reduce((s, i) => s + i.lineTotal, 0) };
}

const fmt = (n) => `€ ${n.toFixed(2)}`;

function MacroChips({ m }) {
  const cell = (label, val, unit, last) => (
    <div key={label} className="flex flex-col items-center px-2 py-1"
      style={{ borderRight: last ? "none" : "1px solid #E3E0D6" }}>
      <span className="text-[13px] font-semibold" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{val}{unit}</span>
      <span className="text-[9px] uppercase tracking-wider opacity-70">{label}</span>
    </div>
  );
  return (
    <div className="inline-flex mt-2" style={{ border: "1px solid #E3E0D6" }}>
      {cell("kcal", m.kcal, "")}
      {cell("protein", m.protein, "g")}
      {cell("carbs", m.carbs, "g")}
      {cell("fat", m.fat, "g", true)}
    </div>
  );
}

function StepGrid({ step }) {
  const cols = [COLORS.blue, COLORS.red, COLORS.yellow, COLORS.ink];
  return (
    <div className="flex gap-1.5 mb-8">
      {cols.map((c, i) => (
        <div key={i} className="h-2 flex-1 transition-all duration-300"
          style={{ backgroundColor: step >= i ? c : "#DDD9CE" }} />
      ))}
    </div>
  );
}

function ShellCard({ children }) {
  return (
    <div className="w-full max-w-xl mx-auto p-8 sm:p-10"
      style={{ backgroundColor: "#FFF", border: `2px solid ${COLORS.ink}` }}>
      {children}
    </div>
  );
}

function NavButtons({ onBack, onNext, nextDisabled, nextLabel = "Next" }) {
  return (
    <div className="flex items-center justify-between mt-10">
      {onBack ? (
        <button onClick={onBack} className="flex items-center gap-1 px-4 py-2 text-sm font-medium" style={{ color: COLORS.ink }}>
          <ChevronLeft size={16} /> Back
        </button>
      ) : <span />}
      <button onClick={onNext} disabled={nextDisabled}
        className="flex items-center gap-2 px-6 py-3 text-sm font-semibold tracking-wide uppercase"
        style={{ backgroundColor: COLORS.ink, color: "#FFF", opacity: nextDisabled ? 0.35 : 1, cursor: nextDisabled ? "not-allowed" : "pointer" }}>
        {nextLabel} <ChevronRight size={16} />
      </button>
    </div>
  );
}

export default function App() {
  const [step, setStep] = useState(0);
  const [market, setMarket] = useState(null);
  const [budget, setBudget] = useState(80);
  const [days, setDays] = useState([]);
  const [diet, setDiet] = useState(null);

  const toggleDay = (k) => setDays((d) => (d.includes(k) ? d.filter((x) => x !== k) : [...d, k]));

  const plan = useMemo(() => {
    if (step < 4 || !market || !diet || days.length === 0) return null;
    const numDays = days.length;
    const mealPlan = pickMealPlan(diet, numDays, market);
    const dayList = DAYS.filter((d) => days.includes(d.key));
    const dayPlans = dayList.map((d, i) => ({
      day: d,
      meals: MEALS.map((m) => ({ meal: m, recipe: mealPlan[m.key][i] })),
    }));
    const allPicks = dayPlans.flatMap((dp) => dp.meals.map((x) => x.recipe));
    const { items, grandTotal } = buildShoppingList(allPicks, market);
    // average daily totals (breakfast + lunch + dinner)
    const dailyTotals = dayPlans.map((dp) =>
      dp.meals.reduce(
        (a, { recipe }) => ({
          kcal: a.kcal + recipe.macros.kcal, protein: a.protein + recipe.macros.protein,
          carbs: a.carbs + recipe.macros.carbs, fat: a.fat + recipe.macros.fat,
        }),
        { kcal: 0, protein: 0, carbs: 0, fat: 0 }
      )
    );
    const avg = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
    dailyTotals.forEach((t) => Object.keys(avg).forEach((k) => (avg[k] += t[k])));
    Object.keys(avg).forEach((k) => (avg[k] = Math.round(avg[k] / numDays)));
    return { dayPlans, dailyTotals, items, grandTotal, avg, overBudget: grandTotal > budget };
  }, [step, market, diet, days, budget]);

  const reset = () => { setStep(0); setMarket(null); setBudget(80); setDays([]); setDiet(null); };

  return (
    <div className="min-h-screen w-full py-10 px-4" style={{ backgroundColor: COLORS.bg, fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        input[type="range"] { -webkit-appearance: none; height: 4px; background: ${COLORS.ink}; }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none; width: 22px; height: 22px; border-radius: 0;
          background: ${COLORS.red}; border: 2px solid ${COLORS.ink}; cursor: pointer; margin-top: -1px;
        }
      `}</style>

      <div className="max-w-xl mx-auto mb-8 flex items-center gap-3">
        <div style={{ backgroundColor: COLORS.red, width: 14, height: 14 }} />
        <div style={{ backgroundColor: COLORS.blue, width: 14, height: 14 }} />
        <div style={{ backgroundColor: COLORS.yellow, width: 14, height: 14 }} />
        <h1 className="text-2xl sm:text-3xl ml-1" style={{ fontFamily: "'Archivo Black', sans-serif", color: COLORS.ink }}>
          Boodschappenplanner
        </h1>
      </div>

      {step < 4 && (
        <ShellCard>
          <StepGrid step={step} />

          {step === 0 && (
            <div>
              <p className="text-xs uppercase tracking-widest mb-2" style={{ color: COLORS.grey }}>Step 1 of 4</p>
              <h2 className="text-xl font-semibold mb-6">Which supermarket do you shop at?</h2>
              <div className="grid grid-cols-2 gap-3">
                {STORES.map((m) => (
                  <button key={m.id} onClick={() => setMarket(m.id)} className="p-4 text-left"
                    style={{ border: `2px solid ${COLORS.ink}`, backgroundColor: market === m.id ? m.accent : "#FFF", color: market === m.id ? m.text : COLORS.ink }}>
                    <div className="font-semibold flex items-center justify-between">
                      {m.name}
                      {market === m.id && <Check size={16} />}
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-xs mt-3" style={{ color: COLORS.grey }}>Prices via the checkjebon.nl open dataset.</p>
              <NavButtons onNext={() => setStep(1)} nextDisabled={!market} />
            </div>
          )}

          {step === 1 && (
            <div>
              <p className="text-xs uppercase tracking-widest mb-2" style={{ color: COLORS.grey }}>Step 2 of 4</p>
              <h2 className="text-xl font-semibold mb-2">What's your weekly budget?</h2>
              <p className="text-sm mb-6" style={{ color: COLORS.grey }}>Covers breakfast, lunch and dinner on your cooking days.</p>
              <div className="text-4xl font-semibold mb-6" style={{ fontFamily: "'IBM Plex Mono', monospace", color: COLORS.blue }}>{fmt(budget)}</div>
              <input type="range" min={0} max={200} step={5} value={budget} onChange={(e) => setBudget(Number(e.target.value))} className="w-full" />
              <div className="flex justify-between text-xs mt-2" style={{ color: COLORS.grey }}><span>€ 0</span><span>€ 200</span></div>
              <NavButtons onBack={() => setStep(0)} onNext={() => setStep(2)} />
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="text-xs uppercase tracking-widest mb-2" style={{ color: COLORS.grey }}>Step 3 of 4</p>
              <h2 className="text-xl font-semibold mb-6">Which days do you want to cook?</h2>
              <div className="grid grid-cols-7 gap-2">
                {DAYS.map((d) => (
                  <button key={d.key} onClick={() => toggleDay(d.key)} title={d.full}
                    className="aspect-square flex items-center justify-center font-semibold text-sm"
                    style={{ border: `2px solid ${COLORS.ink}`, backgroundColor: days.includes(d.key) ? COLORS.yellow : "#FFF" }}>
                    {d.label}
                  </button>
                ))}
              </div>
              <p className="text-sm mt-4" style={{ color: COLORS.grey }}>
                {days.length} day{days.length !== 1 ? "s" : ""} × 3 meals = {days.length * 3} recipes
              </p>
              <NavButtons onBack={() => setStep(1)} onNext={() => setStep(3)} nextDisabled={days.length === 0} />
            </div>
          )}

          {step === 3 && (
            <div>
              <p className="text-xs uppercase tracking-widest mb-2" style={{ color: COLORS.grey }}>Step 4 of 4</p>
              <h2 className="text-xl font-semibold mb-6">What kind of diet?</h2>
              <div className="grid grid-cols-1 gap-4">
                {[
                  { id: "basic", name: "Basic Healthy", desc: "Balanced everyday meals — veg, grains, legumes, some meat and fish. Roughly 1,300–1,500 kcal across the three meals." },
                  { id: "protein", name: "High Protein", desc: "Meat, fish, eggs, dairy and legumes lead every meal. Roughly 120–150g protein per day." },
                ].map((opt) => (
                  <button key={opt.id} onClick={() => setDiet(opt.id)} className="p-5 text-left"
                    style={{ border: `2px solid ${COLORS.ink}`, backgroundColor: diet === opt.id ? COLORS.ink : "#FFF", color: diet === opt.id ? "#FFF" : COLORS.ink }}>
                    <div className="font-semibold text-lg mb-1">{opt.name}</div>
                    <div className="text-sm opacity-80">{opt.desc}</div>
                  </button>
                ))}
              </div>
              <NavButtons onBack={() => setStep(2)} onNext={() => setStep(4)} nextDisabled={!diet} nextLabel="Generate plan" />
            </div>
          )}
        </ShellCard>
      )}

      {step === 4 && plan && (
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 p-4 flex flex-wrap items-center gap-x-6 gap-y-2"
            style={{ backgroundColor: COLORS.ink, color: "#FFF" }}>
            <span className="flex items-center gap-2 text-xs uppercase tracking-widest font-semibold">
              <Flame size={14} /> Average per day (3 meals)
            </span>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace" }} className="text-sm">
              {plan.avg.kcal} kcal · {plan.avg.protein}g protein · {plan.avg.carbs}g carbs · {plan.avg.fat}g fat
            </span>
          </div>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Day-by-day plan */}
            <div className="lg:col-span-3 order-2 lg:order-1">
              <h2 className="text-lg font-semibold mb-4">This week's meals</h2>
              <div className="space-y-6">
                {plan.dayPlans.map(({ day, meals }, di) => (
                  <div key={day.key}>
                    <div className="flex items-center justify-between mb-2 px-1">
                      <span className="text-sm font-semibold uppercase tracking-widest">{day.full}</span>
                      <span className="text-xs" style={{ color: COLORS.grey, fontFamily: "'IBM Plex Mono', monospace" }}>
                        {plan.dailyTotals[di].kcal} kcal · {plan.dailyTotals[di].protein}g protein
                      </span>
                    </div>
                    <div className="space-y-3">
                      {meals.map(({ meal, recipe }) => (
                        <div key={meal.key} className="p-4 bg-white" style={{ border: `2px solid ${COLORS.ink}` }}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-1"
                              style={{ backgroundColor: meal.color, color: meal.text }}>
                              {meal.label}
                            </span>
                            <span className="text-xs flex items-center gap-1" style={{ color: COLORS.grey }}>
                              <Clock size={12} /> {recipe.time}
                            </span>
                          </div>
                          <div className="font-semibold mb-1">{recipe.name}</div>
                          <MacroChips m={recipe.macros} />
                          <div className="mt-3">
                            <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: COLORS.grey }}>How to make it</div>
                            <ol className="text-sm space-y-1.5 list-decimal list-inside" style={{ color: "#4A4C52" }}>
                              {recipe.steps.map((s, i) => <li key={i}>{s}</li>)}
                            </ol>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={reset} className="mt-6 flex items-center gap-2 text-sm font-medium px-4 py-2"
                style={{ border: `2px solid ${COLORS.ink}` }}>
                <RotateCcw size={14} /> Start over
              </button>
            </div>

            {/* Receipt */}
            <div className="lg:col-span-2 order-1 lg:order-2">
              <div className="lg:sticky lg:top-4 p-5" style={{ backgroundColor: "#FFF", border: `2px solid ${COLORS.ink}`, fontFamily: "'IBM Plex Mono', monospace" }}>
                <div className="flex items-center gap-2 mb-1">
                  <ShoppingCart size={16} />
                  <span className="text-xs uppercase tracking-widest font-semibold">{STORES.find((s) => s.id === market)?.name}</span>
                </div>
                <div className="text-[10px] mb-4" style={{ color: COLORS.grey }}>Boodschappenlijst — checkjebon.nl prices</div>
                <div style={{ borderTop: `1px dashed ${COLORS.ink}` }} className="pt-3 space-y-2">
                  {plan.items.map((it) => (
                    <div key={it.id} className="flex justify-between text-xs gap-2">
                      <span className="flex-1">{it.name} <span style={{ color: COLORS.grey }}>×{it.packs} ({it.pack})</span></span>
                      <span>{fmt(it.lineTotal)}</span>
                    </div>
                  ))}
                </div>
                <div style={{ borderTop: `2px solid ${COLORS.ink}` }} className="mt-4 pt-3 flex justify-between items-center font-semibold text-base">
                  <span>TOTAAL</span><span>{fmt(plan.grandTotal)}</span>
                </div>
                {plan.overBudget ? (
                  <div className="mt-3 flex items-start gap-2 text-xs p-2" style={{ backgroundColor: "#FDECEC", color: COLORS.red }}>
                    <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                    <span>Over your {fmt(budget)} budget by {fmt(plan.grandTotal - budget)}. Try fewer cooking days or the Basic Healthy diet.</span>
                  </div>
                ) : (
                  <div className="mt-3 flex items-start gap-2 text-xs p-2" style={{ backgroundColor: "#EAF3E4", color: "#2E6B1F" }}>
                    <Check size={14} className="mt-0.5 flex-shrink-0" />
                    <span>{fmt(budget - plan.grandTotal)} under budget.</span>
                  </div>
                )}
                <div className="mt-5 flex gap-[2px] h-8">
                  {Array.from({ length: 40 }).map((_, i) => (
                    <div key={i} style={{ backgroundColor: COLORS.ink, width: i % 3 === 0 ? 2 : 1, height: "100%" }} />
                  ))}
                </div>
              </div>
              <p className="text-[11px] mt-3 px-1" style={{ color: COLORS.grey }}>
                Prices via the checkjebon.nl open dataset (snapshot; the self-hosted version refreshes weekly). Macros are estimates per serving.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
