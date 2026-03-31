export interface Theme {
  id: string;
  name: string;
  emoji: string;
  backgroundColor: string;
  cardColors: string[];
  wheelColors: string[];
  cardFrontEmojis: string[];
  celebrationText: string;
}

export const themes: Theme[] = [
  {
    id: "fruits",
    name: "Meyveler",
    emoji: "🍎",
    backgroundColor: "#FFF9E6",
    cardColors: ["#FF6B6B", "#FFE66D", "#4ECDC4", "#FF8A5C", "#A8E6CF"],
    wheelColors: ["#FF6B6B", "#FFE66D", "#4ECDC4", "#FF8A5C", "#A8E6CF", "#FF7EB3", "#7EC8E3", "#C3A6FF"],
    cardFrontEmojis: ["🍎", "🍊", "🍋", "🍇", "🍓", "🍑", "🍒", "🥝", "🍌", "🍉", "🫐", "🍍"],
    celebrationText: "Aferin! 🎉",
  },
  {
    id: "farm",
    name: "Şirin Çiftlik Hayvanları",
    emoji: "🐄",
    backgroundColor: "#F0FFF0",
    cardColors: ["#8BC34A", "#CDDC39", "#FFD54F", "#A1887F", "#81C784"],
    wheelColors: ["#8BC34A", "#CDDC39", "#FFD54F", "#A1887F", "#81C784", "#FFB74D", "#AED581", "#DCE775"],
    cardFrontEmojis: ["🐄", "🐑", "🐔", "🐷", "🐴", "🐰", "🦆", "🐶", "🐱", "🐸", "🦊", "🐻"],
    celebrationText: "Harikasın! 🌟",
  },
  {
    id: "cars",
    name: "Arabalar",
    emoji: "🚗",
    backgroundColor: "#F0F4FF",
    cardColors: ["#2196F3", "#F44336", "#FF9800", "#4CAF50", "#9C27B0"],
    wheelColors: ["#2196F3", "#F44336", "#FF9800", "#4CAF50", "#9C27B0", "#00BCD4", "#FF5722", "#607D8B"],
    cardFrontEmojis: ["🚗", "🚕", "🚙", "🏎️", "🚓", "🚑", "🚒", "🚐", "🛻", "🚚", "🚜", "🏍️"],
    celebrationText: "Süpersin! 🏁",
  },
  {
    id: "april23",
    name: "23 Nisan",
    emoji: "🇹🇷",
    backgroundColor: "#FFF5F5",
    cardColors: ["#E53935", "#FFFFFF", "#E53935", "#FFFFFF", "#E53935"],
    wheelColors: ["#E53935", "#FFFFFF", "#E53935", "#FFFFFF", "#E53935", "#FFFFFF", "#E53935", "#FFFFFF"],
    cardFrontEmojis: ["🎈", "🇹🇷", "🎉", "⭐", "🌙", "🎊", "🎀", "🏵️", "🎗️", "🌟", "🎯", "🎪"],
    celebrationText: "23 Nisan Kutlu Olsun! 🇹🇷",
  },
  {
    id: "classroom",
    name: "Sınıf Teması",
    emoji: "📚",
    backgroundColor: "#FFFDE7",
    cardColors: ["#5C6BC0", "#26A69A", "#EF5350", "#AB47BC", "#42A5F5"],
    wheelColors: ["#5C6BC0", "#26A69A", "#EF5350", "#AB47BC", "#42A5F5", "#66BB6A", "#FFA726", "#EC407A"],
    cardFrontEmojis: ["📚", "✏️", "📐", "🎒", "📝", "🖍️", "📎", "📏", "🔬", "🎨", "🧮", "📖"],
    celebrationText: "Tebrikler! ⭐",
  },
  {
    id: "aliens",
    name: "Şirin Uzaylılar",
    emoji: "👽",
    backgroundColor: "#F3E5F5",
    cardColors: ["#7C4DFF", "#00E676", "#FF4081", "#18FFFF", "#FFEA00"],
    wheelColors: ["#7C4DFF", "#00E676", "#FF4081", "#18FFFF", "#FFEA00", "#B388FF", "#69F0AE", "#FF80AB"],
    cardFrontEmojis: ["👽", "🛸", "🌌", "⭐", "🪐", "🚀", "🌙", "☄️", "🔭", "💫", "🌠", "👾"],
    celebrationText: "Galaksi Şampiyonu! 🚀",
  },
  {
    id: "blue",
    name: "Mavi Tema",
    emoji: "💙",
    backgroundColor: "#E3F2FD",
    cardColors: ["#1565C0", "#1E88E5", "#42A5F5", "#64B5F6", "#90CAF9"],
    wheelColors: ["#0D47A1", "#1565C0", "#1976D2", "#1E88E5", "#2196F3", "#42A5F5", "#64B5F6", "#90CAF9"],
    cardFrontEmojis: ["💎", "🦋", "🐳", "💙", "🧊", "🌊", "🐬", "💠", "🫧", "🔵", "🌀", "❄️"],
    celebrationText: "Muhteşem! 💙",
  },
  {
    id: "pink",
    name: "Pembe Tema",
    emoji: "💖",
    backgroundColor: "#FCE4EC",
    cardColors: ["#C2185B", "#E91E63", "#EC407A", "#F06292", "#F48FB1"],
    wheelColors: ["#880E4F", "#C2185B", "#D81B60", "#E91E63", "#EC407A", "#F06292", "#F48FB1", "#F8BBD0"],
    cardFrontEmojis: ["🌸", "💖", "🦩", "🎀", "🌺", "💗", "🩷", "🌷", "🦄", "💝", "🎠", "🧁"],
    celebrationText: "Harikasın! 💖",
  },
  {
    id: "treasure",
    name: "Hazine Sandığı",
    emoji: "📦",
    backgroundColor: "#FFF8E1",
    cardColors: ["#8D6E63", "#A1887F", "#795548", "#D7CCC8", "#BCAAA4"],
    wheelColors: ["#8D6E63", "#FFD54F", "#A1887F", "#FFC107", "#795548", "#FFB300", "#D7CCC8", "#FF8F00"],
    cardFrontEmojis: ["📦", "🧰", "🎁", "📦", "🗝️", "🎁", "📦", "🧰", "🎁", "📦", "🗝️", "🎁"],
    celebrationText: "Hazineyi Buldun! 🏆",
  },
];

export function getTheme(id: string): Theme {
  return themes.find((t) => t.id === id) || themes[0];
}
