export interface WrongItem {
  text: string;           // Yanlış yapılan öğe/soru
  correctAnswer?: string; // Doğru cevap
  userAnswer?: string;    // Danışanın verdiği cevap
}

export interface GameStats {
  totalItems: number;
  correctCount: number;
  wrongCount: number;
  timeSeconds: number;
  completedAt: string;
  wrongItems: WrongItem[];
}
