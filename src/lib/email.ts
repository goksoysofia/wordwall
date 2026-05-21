import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

interface CompletionEmailParams {
  therapistEmail: string;
  therapistName: string;
  playerName: string;
  activityTitle: string;
  activityType: string;
  stats: {
    totalItems: number;
    correctCount: number;
    wrongCount: number;
    timeSeconds: number;
    completedAt: string;
    wrongItems: { text: string; correctAnswer?: string; userAnswer?: string }[];
  };
  playUrl: string;
}

export async function sendActivityCompletionEmail(params: CompletionEmailParams) {
  const {
    therapistEmail,
    therapistName,
    playerName,
    activityTitle,
    activityType,
    stats,
    playUrl,
  } = params;

  const accuracy = stats.totalItems > 0
    ? Math.round((stats.correctCount / stats.totalItems) * 100)
    : 0;

  const minutes = Math.floor(stats.timeSeconds / 60);
  const seconds = stats.timeSeconds % 60;
  const timeStr = minutes > 0
    ? `${minutes} dk ${seconds} sn`
    : `${seconds} saniye`;

  const completedDate = new Date(stats.completedAt);
  const dateStr = completedDate.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const typeLabels: Record<string, string> = {
    wheel: "🎡 Çark",
    card: "🃏 Kart Açma",
    match: "🔗 Eşleştirme",
    "group-sort": "📂 Gruplama",
    quiz: "❓ Quiz",
    "missing-word": "✏️ Boşluk Doldur",
    memory: "🧠 Hafıza Oyunu",
    "balloon-pop": "🎈 Balon Patlatma",
  };
  const typeLabel = typeLabels[activityType] || activityType;

  // Determine accent color based on accuracy
  const accentColor = accuracy >= 80 ? "#22c55e" : accuracy >= 60 ? "#f59e0b" : "#ef4444";
  const accentBg = accuracy >= 80 ? "#f0fdf4" : accuracy >= 60 ? "#fefce8" : "#fef2f2";
  const emoji = accuracy === 100 ? "🏆" : accuracy >= 80 ? "🌟" : accuracy >= 60 ? "💪" : "🎯";

  // Build wrong items table rows
  let wrongItemsHtml = "";
  if (stats.wrongItems && stats.wrongItems.length > 0) {
    const rows = stats.wrongItems
      .map(
        (item) => `
      <tr>
        <td style="padding: 10px 14px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #334155;">${item.text}</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #22c55e; font-weight: 600;">${item.correctAnswer || "—"}</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #ef4444; font-weight: 600;">${item.userAnswer || "—"}</td>
      </tr>`
      )
      .join("");

    wrongItemsHtml = `
    <div style="margin-top: 24px;">
      <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 700; color: #1e293b;">
        📋 Hatalı Öğeler
      </h3>
      <table style="width: 100%; border-collapse: collapse; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
        <thead>
          <tr style="background: #f8fafc;">
            <th style="padding: 10px 14px; text-align: left; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Öğe</th>
            <th style="padding: 10px 14px; text-align: left; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Doğru Cevap</th>
            <th style="padding: 10px 14px; text-align: left; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Verilen Cevap</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>`;
  }

  const html = `
<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"></head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 560px; margin: 0 auto; padding: 32px 16px;">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 16px 16px 0 0; padding: 28px 24px; text-align: center;">
      <div style="font-size: 40px; margin-bottom: 8px;">${emoji}</div>
      <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: white;">Etkinlik Tamamlandı!</h1>
      <p style="margin: 6px 0 0 0; font-size: 14px; color: rgba(255,255,255,0.85);">${dateStr}</p>
    </div>

    <!-- Main Card -->
    <div style="background: white; border-radius: 0 0 16px 16px; padding: 28px 24px; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">
      
      <!-- Player & Activity Info -->
      <div style="background: #f8fafc; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 4px 0; font-size: 13px; color: #64748b; font-weight: 600;">👤 Danışan</td>
            <td style="padding: 4px 0; font-size: 15px; color: #1e293b; font-weight: 700; text-align: right;">${playerName}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; font-size: 13px; color: #64748b; font-weight: 600;">🎮 Etkinlik</td>
            <td style="padding: 4px 0; font-size: 15px; color: #1e293b; font-weight: 700; text-align: right;">${activityTitle}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; font-size: 13px; color: #64748b; font-weight: 600;">📂 Tür</td>
            <td style="padding: 4px 0; font-size: 15px; color: #1e293b; font-weight: 700; text-align: right;">${typeLabel}</td>
          </tr>
        </table>
      </div>

      <!-- Score Cards -->
      <div style="display: flex; gap: 10px; margin-bottom: 20px;">
        <div style="flex: 1; background: ${accentBg}; border-radius: 12px; padding: 16px; text-align: center; border: 1px solid ${accentColor}22;">
          <div style="font-size: 28px; font-weight: 800; color: ${accentColor};">%${accuracy}</div>
          <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px;">Başarı</div>
        </div>
        <div style="flex: 1; background: #f0fdf4; border-radius: 12px; padding: 16px; text-align: center; border: 1px solid #22c55e22;">
          <div style="font-size: 28px; font-weight: 800; color: #22c55e;">${stats.correctCount}</div>
          <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px;">Doğru</div>
        </div>
        <div style="flex: 1; background: #fef2f2; border-radius: 12px; padding: 16px; text-align: center; border: 1px solid #ef444422;">
          <div style="font-size: 28px; font-weight: 800; color: #ef4444;">${stats.wrongCount}</div>
          <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px;">Yanlış</div>
        </div>
      </div>

      <!-- Time & Total -->
      <div style="display: flex; gap: 10px; margin-bottom: 20px;">
        <div style="flex: 1; background: #f8fafc; border-radius: 12px; padding: 14px; text-align: center; border: 1px solid #e2e8f0;">
          <div style="font-size: 20px; font-weight: 800; color: #1e293b;">⏱️ ${timeStr}</div>
          <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-top: 2px;">Süre</div>
        </div>
        <div style="flex: 1; background: #f8fafc; border-radius: 12px; padding: 14px; text-align: center; border: 1px solid #e2e8f0;">
          <div style="font-size: 20px; font-weight: 800; color: #1e293b;">📊 ${stats.totalItems}</div>
          <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-top: 2px;">Toplam Öğe</div>
        </div>
      </div>

      <!-- Wrong Items Table -->
      ${wrongItemsHtml}

      <!-- Play Link -->
      <div style="margin-top: 24px; text-align: center;">
        <a href="${playUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; padding: 12px 28px; border-radius: 12px; font-size: 14px; font-weight: 700;">
          🔗 Etkinliği Görüntüle
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 20px 0; font-size: 12px; color: #94a3b8;">
      <p style="margin: 0;">Bu e-posta WordWall Terapi Platformu tarafından otomatik gönderilmiştir.</p>
    </div>
  </div>
</body>
</html>`;

  const senderName = therapistName || "WordWall";

  await transporter.sendMail({
    from: `"${senderName}" <${process.env.GMAIL_USER}>`,
    to: therapistEmail,
    subject: `${emoji} ${playerName} "${activityTitle}" etkinliğini tamamladı — %${accuracy} başarı`,
    html,
  });
}
