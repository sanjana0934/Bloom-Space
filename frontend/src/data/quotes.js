export const MOM_QUOTES = [
  { text: "You don't have to be perfect to be a wonderful mother.", author: "Unknown" },
  { text: "Some days you win, some days you learn — and both count as good parenting.", author: "Unknown" },
  { text: "Taking care of yourself is part of taking care of your baby.", author: "Unknown" },
  { text: "You are not alone, and what you're feeling is more common than the silence around it suggests.", author: "Unknown" },
  { text: "Progress, not perfection — one feed, one nap, one hour at a time.", author: "Unknown" },
  { text: "Your worth as a mother isn't measured by how hard today felt.", author: "Unknown" },
  { text: "It's okay to ask for help. Asking is not failing.", author: "Unknown" },
  { text: "You survived every hard day so far. That's not nothing.", author: "Unknown" },
  { text: "Rest is productive too, especially right now.", author: "Unknown" },
  { text: "Your baby doesn't need a perfect mother. They need you.", author: "Unknown" },
  { text: "Small steps still move you forward.", author: "Unknown" },
  { text: "Be as gentle with yourself as you are with your baby.", author: "Unknown" },
  { text: "This season is hard, and it is also temporary.", author: "Unknown" },
  { text: "You are learning a whole new person, and it's okay to not know everything yet.", author: "Unknown" },
  { text: "Your feelings are valid, even the complicated ones.", author: "Unknown" },
];

export const FAMILY_QUOTES = [
  { text: "The best support doesn't fix things — it just stays.", author: "Unknown" },
  { text: "Showing up quietly, again and again, is its own kind of love.", author: "Unknown" },
  { text: "Sometimes the most helpful thing you can say is nothing — just listen.", author: "Unknown" },
  { text: "A little patience today can mean a lot to someone who's exhausted.", author: "Unknown" },
  { text: "Noticing is the first step to helping.", author: "Unknown" },
  { text: "You don't need the right words. You just need to be there.", author: "Unknown" },
  { text: "Small acts of help add up to something she'll remember.", author: "Unknown" },
  { text: "Checking in, even briefly, matters more than you think.", author: "Unknown" },
  { text: "Your steadiness gives her room to feel whatever she's feeling.", author: "Unknown" },
  { text: "Supporting someone through this is its own quiet act of care.", author: "Unknown" },
];

function dayOfYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function getQuoteOfDay(list) {
  const idx = dayOfYear() % list.length;
  return list[idx];
}