export interface Theme {
  id: string;
  name: string;
  emoji: string;
  backgroundColor: string;
  cardColors: string[];
  wheelColors: string[];
  cardFrontEmojis: string[];
  celebrationText: string;
  accentColor: string;
  accentGradient: string;
}

export const themes: Theme[] = [
  {
    id: "fruits",
    name: "Meyveler",
    emoji: "🍎",
    backgroundColor: "#FFF9E6",
    cardColors: ["#FF6B6B", "#FFE66D", "#4ECDC4", "#FF8A5C", "#A8E6CF", "#FF7EB3", "#7EC8E3"],
    wheelColors: ["#FF6B6B", "#FFE66D", "#4ECDC4", "#FF8A5C", "#A8E6CF", "#FF7EB3", "#7EC8E3", "#C3A6FF"],
    cardFrontEmojis: ["🍎", "🍊", "🍋", "🍇", "🍓", "🍑", "🍒", "🥝", "🍌", "🍉", "🫐", "🍍"],
    celebrationText: "Aferin! 🎉",
    accentColor: "#FF6B6B",
    accentGradient: "linear-gradient(135deg, #FF6B6B, #FFE66D)",
  },
  {
    id: "farm",
    name: "Sevimli Çiftlik",
    emoji: "🐄",
    backgroundColor: "#F0FFF0",
    cardColors: ["#8BC34A", "#CDDC39", "#FFD54F", "#A1887F", "#81C784", "#FFB74D", "#AED581"],
    wheelColors: ["#8BC34A", "#CDDC39", "#FFD54F", "#A1887F", "#81C784", "#FFB74D", "#AED581", "#DCE775"],
    cardFrontEmojis: ["🐄", "🐑", "🐔", "🐷", "🐴", "🐰", "🦆", "🐶", "🐱", "🐸", "🦊", "🐻"],
    celebrationText: "Harikasın! 🌟",
    accentColor: "#8BC34A",
    accentGradient: "linear-gradient(135deg, #8BC34A, #FFD54F)",
  },
  {
    id: "cars",
    name: "Hızlı Arabalar",
    emoji: "🚗",
    backgroundColor: "#F0F4FF",
    cardColors: ["#2196F3", "#F44336", "#FF9800", "#4CAF50", "#9C27B0", "#00BCD4", "#FF5722"],
    wheelColors: ["#2196F3", "#F44336", "#FF9800", "#4CAF50", "#9C27B0", "#00BCD4", "#FF5722", "#607D8B"],
    cardFrontEmojis: ["🚗", "🚕", "🚙", "🏎️", "🚓", "🚑", "🚒", "🚐", "🛻", "🚚", "🚜", "🏍️"],
    celebrationText: "Süpersin! 🏁",
    accentColor: "#2196F3",
    accentGradient: "linear-gradient(135deg, #2196F3, #FF9800)",
  },
  {
    id: "april23",
    name: "23 Nisan",
    emoji: "🇹🇷",
    backgroundColor: "#FFF5F5",
    cardColors: ["#E53935", "#FFFFFF", "#E53935", "#FFFFFF", "#E53935", "#FFFFFF", "#E53935"],
    wheelColors: ["#E53935", "#FFFFFF", "#E53935", "#FFFFFF", "#E53935", "#FFFFFF", "#E53935", "#FFFFFF"],
    cardFrontEmojis: ["🎈", "🇹🇷", "🎉", "⭐", "🌙", "🎊", "🎀", "🏵️", "🎗️", "🌟", "🎯", "🎪"],
    celebrationText: "23 Nisan Kutlu Olsun! 🇹🇷",
    accentColor: "#E53935",
    accentGradient: "linear-gradient(135deg, #E53935, #FF8A80)",
  },
  {
    id: "classroom",
    name: "Eğlenceli Sınıf",
    emoji: "📚",
    backgroundColor: "#FFFDE7",
    cardColors: ["#5C6BC0", "#26A69A", "#EF5350", "#AB47BC", "#42A5F5", "#66BB6A", "#FFA726"],
    wheelColors: ["#5C6BC0", "#26A69A", "#EF5350", "#AB47BC", "#42A5F5", "#66BB6A", "#FFA726", "#EC407A"],
    cardFrontEmojis: ["📚", "✏️", "📐", "🎒", "📝", "🖍️", "📎", "📏", "🔬", "🎨", "🧮", "📖"],
    celebrationText: "Tebrikler! ⭐",
    accentColor: "#5C6BC0",
    accentGradient: "linear-gradient(135deg, #5C6BC0, #42A5F5)",
  },
  {
    id: "aliens",
    name: "Uzay Macerası",
    emoji: "👽",
    backgroundColor: "#F3E5F5",
    cardColors: ["#7C4DFF", "#00E676", "#FF4081", "#18FFFF", "#FFEA00", "#B388FF", "#69F0AE"],
    wheelColors: ["#7C4DFF", "#00E676", "#FF4081", "#18FFFF", "#FFEA00", "#B388FF", "#69F0AE", "#FF80AB"],
    cardFrontEmojis: ["👽", "🛸", "🌌", "⭐", "🪐", "🚀", "🌙", "☄️", "🔭", "💫", "🌠", "👾"],
    celebrationText: "Galaksi Şampiyonu! 🚀",
    accentColor: "#7C4DFF",
    accentGradient: "linear-gradient(135deg, #7C4DFF, #18FFFF)",
  },
  {
    id: "blue",
    name: "Okyanus",
    emoji: "🐳",
    backgroundColor: "#E3F2FD",
    cardColors: ["#1565C0", "#1E88E5", "#42A5F5", "#64B5F6", "#90CAF9", "#0D47A1", "#1976D2"],
    wheelColors: ["#0D47A1", "#1565C0", "#1976D2", "#1E88E5", "#2196F3", "#42A5F5", "#64B5F6", "#90CAF9"],
    cardFrontEmojis: ["💎", "🦋", "🐳", "💙", "🧊", "🌊", "🐬", "💠", "🫧", "🔵", "🌀", "❄️"],
    celebrationText: "Muhteşem! 💙",
    accentColor: "#1E88E5",
    accentGradient: "linear-gradient(135deg, #1565C0, #42A5F5)",
  },
  {
    id: "pink",
    name: "Peri Masalı",
    emoji: "🦄",
    backgroundColor: "#FCE4EC",
    cardColors: ["#E91E63", "#EC407A", "#F06292", "#F48FB1", "#FF80AB", "#C2185B", "#D81B60"],
    wheelColors: ["#880E4F", "#C2185B", "#D81B60", "#E91E63", "#EC407A", "#F06292", "#F48FB1", "#F8BBD0"],
    cardFrontEmojis: ["🌸", "💖", "🦩", "🎀", "🌺", "💗", "🩷", "🌷", "🦄", "💝", "🎠", "🧁"],
    celebrationText: "Harikasın! 💖",
    accentColor: "#E91E63",
    accentGradient: "linear-gradient(135deg, #E91E63, #F48FB1)",
  },
  {
    id: "treasure",
    name: "Hazine Avı",
    emoji: "🏴‍☠️",
    backgroundColor: "#FFF8E1",
    cardColors: ["#8D6E63", "#FFD54F", "#A1887F", "#FFC107", "#795548", "#FFB300", "#D7CCC8"],
    wheelColors: ["#8D6E63", "#FFD54F", "#A1887F", "#FFC107", "#795548", "#FFB300", "#D7CCC8", "#FF8F00"],
    cardFrontEmojis: ["📦", "🧰", "🎁", "📦", "🗝️", "🎁", "📦", "🧰", "🎁", "📦", "🗝️", "🎁"],
    celebrationText: "Hazineyi Buldun! 🏆",
    accentColor: "#FFC107",
    accentGradient: "linear-gradient(135deg, #FFB300, #FFC107)",
  },
];

export function getTheme(id: string): Theme {
  return themes.find((t) => t.id === id) || themes[0];
}
