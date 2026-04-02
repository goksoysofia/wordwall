"use client";

import { Activity } from "@/types/activity";

interface PrintViewProps {
  activity: Activity;
  onClose: () => void;
}

export default function PrintView({ activity, onClose }: PrintViewProps) {
  const handlePrint = () => {
    window.print();
  };

  const renderWorksheet = () => {
    const { type, options, title } = activity;

    switch (type) {
      case "wheel":
      case "card":
      case "memory":
        return (
          <div className="worksheet-section">
            <ol className="worksheet-list">
              {options.map((option, index) => (
                <li key={option.id} className="worksheet-list-item">
                  <span className="item-number">{index + 1}.</span>
                  <span className="item-text">{option.text || ""}</span>
                </li>
              ))}
            </ol>
          </div>
        );

      case "match":
        return (
          <div className="worksheet-section">
            <div className="match-header">
              <span className="match-col-header">Sol</span>
              <span className="match-col-spacer"></span>
              <span className="match-col-header">Sağ</span>
            </div>
            {options.map((option) => (
              <div key={option.id} className="match-row">
                <span className="match-left">{option.text || ""}</span>
                <span className="match-line">___</span>
                <span className="match-right">{option.pairText || ""}</span>
              </div>
            ))}
          </div>
        );

      case "group-sort": {
        const groups = Array.from(new Set(options.map((o) => o.group).filter(Boolean))) as string[];
        const maxItemsPerGroup = Math.ceil(options.length / Math.max(groups.length, 1));
        const emptyBoxRows = Math.max(maxItemsPerGroup, 3);

        return (
          <div className="worksheet-section">
            <div className="group-sort-grid">
              {groups.map((group) => (
                <div key={group} className="group-sort-col">
                  <div className="group-sort-header">{group}</div>
                  {Array.from({ length: emptyBoxRows }).map((_, i) => (
                    <div key={i} className="group-sort-box">_________</div>
                  ))}
                </div>
              ))}
            </div>
            <div className="group-sort-items">
              <strong>Öğeler:</strong> {options.map((o) => o.text).filter(Boolean).join(", ")}
            </div>
          </div>
        );
      }

      case "quiz":
        return (
          <div className="worksheet-section">
            <div className="quiz-question">
              <strong>Soru:</strong> {title}
            </div>
            {options.map((option, index) => {
              const letters = ["A", "B", "C", "D", "E", "F"];
              return (
                <div key={option.id} className="quiz-option">
                  <span className="quiz-circle">○</span>
                  <span className="quiz-label">{letters[index] ?? String(index + 1)})</span>
                  <span className="quiz-text">{option.text || ""}</span>
                </div>
              );
            })}
          </div>
        );

      case "missing-word": {
        const sentence = options.find((o) => o.isCorrect)?.text ?? options[0]?.text ?? "";
        const wordBank = options.map((o) => o.text).filter(Boolean).join(" | ");
        return (
          <div className="worksheet-section">
            <div className="missing-word-sentence">
              <strong>Cümle:</strong> {sentence.replace(/_+/, "___")}
            </div>
            <div className="missing-word-bank">
              <strong>Kelimeler:</strong> {wordBank}
            </div>
          </div>
        );
      }

      case "balloon-pop":
        return (
          <div className="worksheet-section">
            <div className="balloon-question">
              <strong>Soru:</strong> {title}
            </div>
            {options.map((option) => (
              <div key={option.id} className="balloon-option">
                <span className="balloon-checkbox">□</span>
                <span className="balloon-text">{option.text || ""}</span>
              </div>
            ))}
          </div>
        );

      default:
        return (
          <div className="worksheet-section">
            <ol className="worksheet-list">
              {options.map((option, index) => (
                <li key={option.id} className="worksheet-list-item">
                  <span className="item-number">{index + 1}.</span>
                  <span className="item-text">{option.text || ""}</span>
                </li>
              ))}
            </ol>
          </div>
        );
    }
  };

  const typeLabels: Record<string, string> = {
    wheel: "Çark",
    card: "Kart",
    memory: "Hafıza",
    match: "Eşleştirme",
    "group-sort": "Gruplama",
    quiz: "Test",
    "missing-word": "Eksik Kelime",
    "balloon-pop": "Balon",
  };

  return (
    <>
      <style>{`
        .print-toolbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 60;
          background: #f3f4f6;
          border-bottom: 1px solid #d1d5db;
          padding: 12px 24px;
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .print-btn {
          background: #1d4ed8;
          color: white;
          border: none;
          padding: 8px 20px;
          border-radius: 6px;
          font-size: 15px;
          cursor: pointer;
          font-weight: 500;
        }

        .print-btn:hover {
          background: #1e40af;
        }

        .close-btn {
          background: white;
          color: #374151;
          border: 1px solid #d1d5db;
          padding: 8px 20px;
          border-radius: 6px;
          font-size: 15px;
          cursor: pointer;
          font-weight: 500;
        }

        .close-btn:hover {
          background: #f9fafb;
        }

        .print-content {
          padding-top: 72px;
        }

        .worksheet {
          background: white;
          max-width: 720px;
          margin: 32px auto;
          padding: 48px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
          font-family: Georgia, 'Times New Roman', serif;
        }

        .worksheet-title {
          font-size: 26px;
          font-weight: 700;
          margin: 0 0 6px 0;
          color: #111827;
          letter-spacing: -0.3px;
        }

        .worksheet-type {
          font-size: 13px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-bottom: 28px;
          font-family: sans-serif;
        }

        .worksheet-divider {
          border: none;
          border-top: 2px solid #111827;
          margin-bottom: 32px;
        }

        .worksheet-section {
          font-size: 16px;
          color: #111827;
          line-height: 1.8;
        }

        .worksheet-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .worksheet-list-item {
          display: flex;
          gap: 12px;
          padding: 6px 0;
          border-bottom: 1px solid #e5e7eb;
        }

        .item-number {
          color: #6b7280;
          min-width: 28px;
          font-family: monospace;
        }

        .item-text {
          flex: 1;
        }

        .match-header {
          display: flex;
          gap: 0;
          margin-bottom: 8px;
          font-weight: 600;
          font-family: sans-serif;
          font-size: 14px;
          color: #374151;
        }

        .match-col-header {
          min-width: 180px;
        }

        .match-col-spacer {
          min-width: 80px;
        }

        .match-row {
          display: flex;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
          gap: 0;
        }

        .match-left {
          min-width: 180px;
        }

        .match-line {
          min-width: 80px;
          color: #9ca3af;
          font-family: monospace;
          letter-spacing: 2px;
        }

        .match-right {
          flex: 1;
        }

        .group-sort-grid {
          display: flex;
          gap: 24px;
          margin-bottom: 24px;
        }

        .group-sort-col {
          flex: 1;
        }

        .group-sort-header {
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          padding: 8px 12px;
          font-weight: 600;
          font-family: sans-serif;
          font-size: 14px;
          text-align: center;
          margin-bottom: 8px;
        }

        .group-sort-box {
          border: 1px solid #d1d5db;
          padding: 8px 12px;
          margin-bottom: 8px;
          min-height: 32px;
          color: #d1d5db;
          font-family: monospace;
        }

        .group-sort-items {
          margin-top: 8px;
          font-size: 14px;
          color: #4b5563;
          font-family: sans-serif;
          padding-top: 12px;
          border-top: 1px solid #e5e7eb;
        }

        .quiz-question {
          margin-bottom: 20px;
          font-size: 17px;
          line-height: 1.5;
        }

        .quiz-option {
          display: flex;
          align-items: baseline;
          gap: 10px;
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
        }

        .quiz-circle {
          font-size: 18px;
          color: #6b7280;
          min-width: 20px;
        }

        .quiz-label {
          font-weight: 600;
          min-width: 28px;
          font-family: sans-serif;
        }

        .quiz-text {
          flex: 1;
        }

        .missing-word-sentence {
          margin-bottom: 24px;
          font-size: 18px;
          line-height: 1.6;
        }

        .missing-word-bank {
          border: 1px solid #d1d5db;
          padding: 12px 16px;
          background: #f9fafb;
          font-family: sans-serif;
          font-size: 15px;
          color: #374151;
        }

        .balloon-question {
          margin-bottom: 20px;
          font-size: 17px;
          line-height: 1.5;
        }

        .balloon-option {
          display: flex;
          align-items: baseline;
          gap: 12px;
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
        }

        .balloon-checkbox {
          font-size: 18px;
          color: #374151;
          min-width: 22px;
        }

        .balloon-text {
          flex: 1;
        }

        @media print {
          .print-toolbar {
            display: none !important;
          }

          .print-content {
            padding-top: 0;
          }

          body {
            background: white !important;
            color: black !important;
          }

          .worksheet {
            margin: 0;
            padding: 24mm 20mm;
            max-width: 100%;
            border: none;
            box-shadow: none;
          }

          .worksheet-title {
            color: black;
          }

          .group-sort-header {
            background: #f3f4f6 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .missing-word-bank {
            background: #f9fafb !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          @page {
            margin: 15mm 20mm;
            size: A4 portrait;
          }
        }
      `}</style>

      <div className="fixed inset-0 z-50 bg-white overflow-auto">
        <div className="print-toolbar">
          <button className="print-btn" onClick={handlePrint}>
            Yazdır 🖨️
          </button>
          <button className="close-btn" onClick={onClose}>
            Kapat ✕
          </button>
        </div>

        <div className="print-content">
          <div className="worksheet">
            <h1 className="worksheet-title">{activity.title}</h1>
            <div className="worksheet-type">{typeLabels[activity.type] ?? activity.type}</div>
            <hr className="worksheet-divider" />
            {renderWorksheet()}
          </div>
        </div>
      </div>
    </>
  );
}
