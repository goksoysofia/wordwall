import Link from "next/link";

export default function LandingPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700;800&family=Nunito:wght@400;500;600;700&display=swap');

        .landing * { box-sizing: border-box; margin: 0; padding: 0; }
        .landing {
          font-family: 'Nunito', sans-serif;
          color: #2D1B69;
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
          background: #FFF8F0;
        }
        .landing h1, .landing h2, .landing h3, .landing h4 {
          font-family: 'Baloo 2', cursive;
        }

        /* NAV */
        .l-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          padding: 1rem 2rem;
          display: flex; justify-content: space-between; align-items: center;
          backdrop-filter: blur(20px);
          background: rgba(255, 248, 240, 0.8);
          border-bottom: 2px solid rgba(45, 27, 105, 0.06);
          transition: box-shadow 0.3s;
        }
        .l-nav.scrolled { box-shadow: 0 4px 30px rgba(45, 27, 105, 0.08); }
        .l-logo {
          font-family: 'Baloo 2', cursive; font-size: 1.75rem; font-weight: 800;
          background: linear-gradient(135deg, #FF6B9D, #FF8A50);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .l-nav-cta {
          background: #2D1B69; color: white; border: none;
          padding: 0.65rem 1.5rem; border-radius: 50px;
          font-family: 'Baloo 2', cursive; font-size: 1rem; font-weight: 600;
          cursor: pointer; transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          text-decoration: none; display: inline-block;
        }
        .l-nav-cta:hover { transform: scale(1.05) translateY(-1px); box-shadow: 0 6px 20px rgba(45, 27, 105, 0.3); }

        /* HERO */
        .l-hero {
          min-height: 100vh; display: flex; flex-direction: column;
          justify-content: center; align-items: center; text-align: center;
          padding: 8rem 2rem 4rem; position: relative; overflow: hidden;
        }
        .l-hero::before {
          content: ''; position: absolute; top: -20%; right: -10%;
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(255, 107, 157, 0.15) 0%, transparent 70%);
          border-radius: 50%; animation: l-blobFloat 8s ease-in-out infinite;
        }
        .l-hero::after {
          content: ''; position: absolute; bottom: -10%; left: -15%;
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(77, 150, 255, 0.12) 0%, transparent 70%);
          border-radius: 50%; animation: l-blobFloat 10s ease-in-out infinite reverse;
        }
        @keyframes l-blobFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.05); }
          66% { transform: translate(-20px, 15px) scale(0.95); }
        }

        .l-badge {
          display: inline-flex; align-items: center; gap: 0.5rem;
          background: white; border: 2px solid rgba(45, 27, 105, 0.08);
          padding: 0.5rem 1.25rem; border-radius: 50px;
          font-size: 0.9rem; font-weight: 600; margin-bottom: 2rem;
          animation: l-fadeUp 0.8s ease-out; position: relative; z-index: 1;
        }
        .l-hero h1 {
          font-size: clamp(3rem, 8vw, 6.5rem); font-weight: 800;
          line-height: 1.05; margin-bottom: 1.5rem;
          position: relative; z-index: 1; animation: l-fadeUp 0.8s ease-out 0.1s both;
        }
        .l-line1 { display: block; color: #2D1B69; }
        .l-line2 {
          display: block;
          background: linear-gradient(135deg, #FF6B9D 0%, #FF8A50 50%, #FFD93D 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .l-hero-sub {
          font-size: clamp(1.1rem, 2.5vw, 1.4rem); color: #8B7BAD;
          max-width: 540px; line-height: 1.6; margin-bottom: 2.5rem;
          position: relative; z-index: 1; animation: l-fadeUp 0.8s ease-out 0.2s both;
        }
        .l-actions {
          display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center;
          position: relative; z-index: 1; animation: l-fadeUp 0.8s ease-out 0.3s both;
        }
        .l-btn-primary {
          background: linear-gradient(135deg, #FF6B9D, #FF8A50);
          color: white; border: none; padding: 1rem 2.5rem; border-radius: 50px;
          font-family: 'Baloo 2', cursive; font-size: 1.25rem; font-weight: 700;
          cursor: pointer; transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          text-decoration: none; display: inline-flex; align-items: center; gap: 0.5rem;
          box-shadow: 0 4px 15px rgba(255, 107, 157, 0.35);
        }
        .l-btn-primary:hover { transform: scale(1.06) translateY(-2px); box-shadow: 0 8px 30px rgba(255, 107, 157, 0.45); }
        .l-btn-secondary {
          background: white; color: #2D1B69; border: 2px solid rgba(45, 27, 105, 0.12);
          padding: 1rem 2rem; border-radius: 50px;
          font-family: 'Baloo 2', cursive; font-size: 1.15rem; font-weight: 600;
          cursor: pointer; transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          text-decoration: none; display: inline-flex; align-items: center; gap: 0.5rem;
        }
        .l-btn-secondary:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(45, 27, 105, 0.1); }

        /* Floating emojis */
        .l-floats { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
        .l-fe {
          position: absolute; font-size: 2.5rem;
          animation: l-emojiFloat 6s ease-in-out infinite; opacity: 0.6;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
        }
        .l-fe:nth-child(1) { top: 15%; left: 8%; animation-delay: 0s; font-size: 3rem; }
        .l-fe:nth-child(2) { top: 20%; right: 10%; animation-delay: 1s; font-size: 2rem; }
        .l-fe:nth-child(3) { top: 55%; left: 5%; animation-delay: 2s; }
        .l-fe:nth-child(4) { top: 60%; right: 7%; animation-delay: 0.5s; font-size: 3.5rem; }
        .l-fe:nth-child(5) { top: 80%; left: 15%; animation-delay: 1.5s; font-size: 2rem; }
        .l-fe:nth-child(6) { top: 35%; right: 18%; animation-delay: 3s; font-size: 2rem; }
        .l-fe:nth-child(7) { top: 75%; right: 20%; animation-delay: 2.5s; }
        .l-fe:nth-child(8) { top: 10%; left: 25%; animation-delay: 4s; font-size: 2rem; }
        @keyframes l-emojiFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-15px) rotate(5deg); }
          75% { transform: translateY(10px) rotate(-3deg); }
        }
        @keyframes l-fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* WAVE */
        .l-wave { width: 100%; line-height: 0; margin-top: -2px; }
        .l-wave svg { display: block; width: 100%; height: 80px; }

        /* FEATURES */
        .l-features { background: white; padding: 6rem 2rem; }
        .l-slabel {
          text-align: center; font-family: 'Baloo 2', cursive;
          font-size: 0.95rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 3px; color: #FF6B9D; margin-bottom: 0.75rem;
        }
        .l-stitle { text-align: center; font-size: clamp(2rem, 5vw, 3.5rem); font-weight: 800; margin-bottom: 1rem; }
        .l-ssub {
          text-align: center; color: #8B7BAD; font-size: 1.15rem;
          max-width: 500px; margin: 0 auto 4rem; line-height: 1.6;
        }
        .l-fgrid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem; max-width: 1100px; margin: 0 auto;
        }
        .l-fcard {
          background: #FFF8F0; border-radius: 24px; padding: 2.5rem;
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); border: 2px solid transparent;
        }
        .l-fcard:hover { transform: translateY(-6px); border-color: rgba(45, 27, 105, 0.08); box-shadow: 0 20px 40px rgba(45, 27, 105, 0.08); }
        .l-ficon {
          width: 72px; height: 72px; border-radius: 20px;
          display: flex; align-items: center; justify-content: center;
          font-size: 2rem; margin-bottom: 1.5rem;
        }
        .l-fcard h3 { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.75rem; }
        .l-fcard p { color: #8B7BAD; line-height: 1.7; font-size: 1.05rem; }

        /* MODES */
        .l-modes { padding: 6rem 2rem; overflow: hidden; }
        .l-mc { max-width: 1100px; margin: 0 auto; }
        .l-mr { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center; margin-bottom: 6rem; }
        .l-mr:last-child { margin-bottom: 0; }
        .l-mr.l-rev { direction: rtl; }
        .l-mr.l-rev > * { direction: ltr; }
        .l-mv {
          position: relative; aspect-ratio: 4/3; border-radius: 24px;
          overflow: hidden; box-shadow: 0 20px 60px rgba(45, 27, 105, 0.12);
        }
        .l-wv {
          background: linear-gradient(135deg, #1a0a3e, #2D1B69);
          display: flex; align-items: center; justify-content: center;
          width: 100%; height: 100%;
        }
        .l-mw { width: 70%; height: 70%; }
        .l-mw svg { width: 100%; height: 100%; animation: l-spin 20s linear infinite; }
        @keyframes l-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .l-cv {
          background: linear-gradient(135deg, #0d2847, #1a4a7a);
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 8px; padding: 12%; align-content: center;
          width: 100%; height: 100%;
        }
        .l-mc-card {
          aspect-ratio: 3/4; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: clamp(1rem, 2vw, 1.8rem); animation: l-cpulse 3s ease-in-out infinite;
        }
        @keyframes l-cpulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.04); } }
        .l-mt h3 { font-size: clamp(1.75rem, 3.5vw, 2.5rem); font-weight: 800; margin-bottom: 1rem; }
        .l-mt p { color: #8B7BAD; font-size: 1.1rem; line-height: 1.7; margin-bottom: 1.5rem; }
        .l-tags { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .l-tag {
          background: #FFF8F0; border: 1.5px solid rgba(45, 27, 105, 0.08);
          padding: 0.4rem 1rem; border-radius: 50px; font-size: 0.85rem; font-weight: 600;
        }

        /* THEMES */
        .l-themes { background: white; padding: 6rem 2rem; }
        .l-tw { overflow: hidden; margin: 0 -2rem; padding: 1rem 0; }
        .l-tt {
          display: flex; gap: 1.25rem;
          animation: l-marquee 30s linear infinite; width: max-content;
        }
        .l-tt:hover { animation-play-state: paused; }
        @keyframes l-marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .l-tp {
          flex-shrink: 0; display: flex; align-items: center; gap: 0.75rem;
          padding: 1rem 1.5rem; border-radius: 50px;
          font-family: 'Baloo 2', cursive; font-size: 1.1rem; font-weight: 600;
          white-space: nowrap; color: white; box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          transition: transform 0.3s;
        }
        .l-tp:hover { transform: scale(1.08); }
        .l-tp span { font-size: 1.5rem; }

        /* STATS */
        .l-stats { padding: 5rem 2rem; text-align: center; }
        .l-sg { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 2rem; max-width: 800px; margin: 0 auto; }
        .l-sn {
          font-family: 'Baloo 2', cursive; font-size: 3rem; font-weight: 800;
          background: linear-gradient(135deg, #FF6B9D, #FF8A50);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
          line-height: 1.1;
        }
        .l-sl { color: #8B7BAD; font-size: 1rem; font-weight: 600; margin-top: 0.25rem; }

        /* CTA */
        .l-cta { padding: 6rem 2rem; text-align: center; }
        .l-cbox {
          max-width: 700px; margin: 0 auto;
          background: linear-gradient(135deg, #2D1B69, #4a2d8f);
          border-radius: 32px; padding: 4rem 3rem; color: white;
          position: relative; overflow: hidden;
        }
        .l-cbox::before {
          content: ''; position: absolute; top: -50%; right: -30%;
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(255, 107, 157, 0.2), transparent 70%);
          border-radius: 50%;
        }
        .l-cbox::after {
          content: ''; position: absolute; bottom: -40%; left: -20%;
          width: 300px; height: 300px;
          background: radial-gradient(circle, rgba(77, 150, 255, 0.15), transparent 70%);
          border-radius: 50%;
        }
        .l-cbox h2 { font-size: clamp(2rem, 4vw, 3rem); font-weight: 800; margin-bottom: 1rem; position: relative; z-index: 1; }
        .l-cbox p { font-size: 1.15rem; opacity: 0.85; margin-bottom: 2rem; position: relative; z-index: 1; line-height: 1.6; }
        .l-btn-cta {
          background: white; color: #2D1B69; border: none;
          padding: 1.1rem 2.5rem; border-radius: 50px;
          font-family: 'Baloo 2', cursive; font-size: 1.3rem; font-weight: 700;
          cursor: pointer; transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          text-decoration: none; display: inline-flex; align-items: center; gap: 0.5rem;
          position: relative; z-index: 1; box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        }
        .l-btn-cta:hover { transform: scale(1.06) translateY(-2px); box-shadow: 0 8px 30px rgba(0,0,0,0.3); }

        /* FOOTER */
        .l-footer {
          text-align: center; padding: 2rem; color: #8B7BAD;
          font-size: 0.9rem; border-top: 1px solid rgba(45, 27, 105, 0.06);
        }
        .l-footer a { color: #FF6B9D; text-decoration: none; font-weight: 600; }

        /* RESPONSIVE */
        @media (max-width: 768px) {
          .l-nav { padding: 0.75rem 1.25rem; }
          .l-logo { font-size: 1.4rem; }
          .l-hero { padding: 7rem 1.5rem 3rem; }
          .l-fe { font-size: 1.5rem !important; opacity: 0.4; }
          .l-fe:nth-child(1), .l-fe:nth-child(4) { font-size: 2rem !important; }
          .l-fgrid { grid-template-columns: 1fr; }
          .l-mr { grid-template-columns: 1fr; gap: 2rem; }
          .l-mr.l-rev { direction: ltr; }
          .l-mv { aspect-ratio: 16/10; }
          .l-cv { padding: 8%; gap: 6px; }
          .l-cbox { padding: 3rem 1.75rem; border-radius: 24px; }
          .l-sg { grid-template-columns: repeat(3, 1fr); gap: 1rem; }
          .l-sn { font-size: 2.2rem; }
        }
        @media (max-width: 480px) {
          .l-actions { flex-direction: column; width: 100%; }
          .l-btn-primary, .l-btn-secondary { width: 100%; justify-content: center; }
        }
      `}</style>

      <div className="landing">
        {/* NAV */}
        <nav className="l-nav" id="l-navbar">
          <div className="l-logo">Wordwall</div>
          <Link href="/dashboard" className="l-nav-cta">Hemen Dene</Link>
        </nav>

        {/* HERO */}
        <section className="l-hero">
          <div className="l-floats">
            <div className="l-fe">🎡</div>
            <div className="l-fe">🃏</div>
            <div className="l-fe">🍎</div>
            <div className="l-fe">🦄</div>
            <div className="l-fe">🚀</div>
            <div className="l-fe">🐳</div>
            <div className="l-fe">⭐</div>
            <div className="l-fe">🎨</div>
          </div>

          <div className="l-badge">
            <span>✨</span> Eğitimciler için tasarlandı
          </div>

          <h1>
            <span className="l-line1">Öğrenmeyi</span>
            <span className="l-line2">Oyuna Dönüştür</span>
          </h1>

          <p className="l-hero-sub">
            Saniyeler içinde interaktif çarklar ve kart oyunları oluşturun.
            Sınıfınızda öğrenme heyecanını ateşleyin.
          </p>

          <div className="l-actions">
            <Link href="/dashboard" className="l-btn-primary">
              Hemen Dene
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M4 10h12m0 0l-4-4m4 4l-4 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
            <a href="#ozellikler" className="l-btn-secondary">
              Keşfet
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 3v12m0 0l-4-4m4 4l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </div>
        </section>

        {/* WAVE */}
        <div className="l-wave">
          <svg viewBox="0 0 1440 80" preserveAspectRatio="none">
            <path fill="white" d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,50 1440,40 L1440,80 L0,80 Z"/>
          </svg>
        </div>

        {/* FEATURES */}
        <section className="l-features" id="ozellikler">
          <div className="l-slabel">Neden Wordwall?</div>
          <h2 className="l-stitle">Her Ders Bir Macera</h2>
          <p className="l-ssub">Kod bilmeden, dakikalar içinde sınıfınız için aktiviteler hazırlayın.</p>

          <div className="l-fgrid">
            <div className="l-fcard">
              <div className="l-ficon" style={{background: 'linear-gradient(135deg, #FFE0EC, #FFCCD5)'}}>🎯</div>
              <h3>Kolay Oluştur</h3>
              <p>Adım adım rehber ile aktivite türünü, temasını ve içeriğini seçin. Birkaç dakikada hazır.</p>
            </div>
            <div className="l-fcard">
              <div className="l-ficon" style={{background: 'linear-gradient(135deg, #D4EDFF, #BAD9FF)'}}>🎮</div>
              <h3>Oyna & Paylaş</h3>
              <p>Her aktivitenin paylaşılabilir bir linki var. Öğrencilerinize gönderin, anında oynasınlar.</p>
            </div>
            <div className="l-fcard">
              <div className="l-ficon" style={{background: 'linear-gradient(135deg, #FFF0CC, #FFE4A0)'}}>🎨</div>
              <h3>10 Eğlenceli Tema</h3>
              <p>Meyveler, uzay macerası, okyanus, peri masalı ve daha fazlası. Her konu için bir tema.</p>
            </div>
          </div>
        </section>

        {/* WAVE */}
        <div className="l-wave" style={{transform: 'scaleY(-1)', marginBottom: '-2px'}}>
          <svg viewBox="0 0 1440 80" preserveAspectRatio="none">
            <path fill="white" d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,50 1440,40 L1440,80 L0,80 Z"/>
          </svg>
        </div>

        {/* GAME MODES */}
        <section className="l-modes">
          <div className="l-slabel">Oyun Modları</div>
          <h2 className="l-stitle">İki Farklı Deneyim</h2>
          <p className="l-ssub">Her öğrenme stiline uygun oyun modları.</p>

          <div className="l-mc">
            {/* Wheel */}
            <div className="l-mr">
              <div className="l-mv">
                <div className="l-wv">
                  <div className="l-mw">
                    <svg viewBox="0 0 200 200">
                      <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2"/>
                      <path d="M100,10 A90,90 0 0,1 177.94,55 L100,100 Z" fill="#FF6B9D"/>
                      <path d="M177.94,55 A90,90 0 0,1 177.94,145 L100,100 Z" fill="#FFD93D"/>
                      <path d="M177.94,145 A90,90 0 0,1 100,190 L100,100 Z" fill="#6BCB77"/>
                      <path d="M100,190 A90,90 0 0,1 22.06,145 L100,100 Z" fill="#4D96FF"/>
                      <path d="M22.06,145 A90,90 0 0,1 22.06,55 L100,100 Z" fill="#FF8A50"/>
                      <path d="M22.06,55 A90,90 0 0,1 100,10 L100,100 Z" fill="#E57CD8"/>
                      <circle cx="100" cy="100" r="18" fill="white" opacity="0.95"/>
                      <circle cx="100" cy="100" r="12" fill="#2D1B69"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div className="l-mt">
                <h3>🎡 Çark Çevir</h3>
                <p>Rastgele seçim çarkı ile dersinize heyecan katın. Öğrenciler çarkı çevirsin, şans kimi seçecek? Ses efektleri ve animasyonlarla tam bir deneyim.</p>
                <div className="l-tags">
                  <span className="l-tag">Rastgele Seçim</span>
                  <span className="l-tag">Ses Efektleri</span>
                  <span className="l-tag">Animasyonlu</span>
                </div>
              </div>
            </div>

            {/* Cards */}
            <div className="l-mr l-rev">
              <div className="l-mv">
                <div className="l-cv">
                  {['#FF6B9D','#FF8A50','#FFD93D','#6BCB77','#4D96FF','#FF6B9D','#FF8A50','#FFD93D','#6BCB77'].map((c, i) => (
                    <div key={i} className="l-mc-card" style={{background: c, animationDelay: `${i * 0.2}s`}}>
                      {['🍎','🐱','🚀','⭐','🎨','🌈','🎵','🦋','🌺'][i]}
                    </div>
                  ))}
                </div>
              </div>
              <div className="l-mt">
                <h3>🃏 Kart Aç</h3>
                <p>3x3 ızgara veya yığın modunda kartları çevirin. Hafıza oyunu, kelime pratiği veya soru-cevap — hayal gücünüzle sınırlı. Tamamlama kutlaması dahil!</p>
                <div className="l-tags">
                  <span className="l-tag">Izgara Modu</span>
                  <span className="l-tag">Yığın Modu</span>
                  <span className="l-tag">Kart Çevirme</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* THEMES MARQUEE */}
        <section className="l-themes">
          <div className="l-slabel">Temalar</div>
          <h2 className="l-stitle">Her Konuya Bir Tema</h2>
          <p className="l-ssub">Rengarenk temalarla aktivitelerinizi kişiselleştirin.</p>

          <div className="l-tw">
            <div className="l-tt">
              {[0, 1].map((rep) => (
                <span key={rep}>{[
                  {bg: 'linear-gradient(135deg, #FF6B6B, #ee5a24)', e: '🍎', n: 'Meyveler'},
                  {bg: 'linear-gradient(135deg, #6BCB77, #2ecc71)', e: '🐄', n: 'Sevimli Çiftlik'},
                  {bg: 'linear-gradient(135deg, #4D96FF, #3742fa)', e: '🚗', n: 'Hızlı Arabalar'},
                  {bg: 'linear-gradient(135deg, #FF6B9D, #e84393)', e: '🇹🇷', n: '23 Nisan'},
                  {bg: 'linear-gradient(135deg, #FF8A50, #f39c12)', e: '📚', n: 'Eğlenceli Sınıf'},
                  {bg: 'linear-gradient(135deg, #8854d0, #6c5ce7)', e: '👽', n: 'Uzay Macerası'},
                  {bg: 'linear-gradient(135deg, #0984e3, #00b894)', e: '🐳', n: 'Okyanus'},
                  {bg: 'linear-gradient(135deg, #fd79a8, #e84393)', e: '🦄', n: 'Peri Masalı'},
                  {bg: 'linear-gradient(135deg, #fdcb6e, #e17055)', e: '🏴‍☠️', n: 'Hazine Avı'},
                  {bg: 'linear-gradient(135deg, #a29bfe, #6c5ce7)', e: '🎭', n: 'Yaratıcı Sahne'},
                ].map((t, i) => (
                  <div key={`${rep}-${i}`} className="l-tp" style={{background: t.bg}}>
                    <span>{t.e}</span> {t.n}
                  </div>
                ))}</span>
              ))}
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="l-stats">
          <div className="l-sg">
            <div>
              <div className="l-sn">2</div>
              <div className="l-sl">Oyun Modu</div>
            </div>
            <div>
              <div className="l-sn">10</div>
              <div className="l-sl">Tema</div>
            </div>
            <div>
              <div className="l-sn">%100</div>
              <div className="l-sl">Ücretsiz</div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="l-cta">
          <div className="l-cbox">
            <h2>Hemen Başlayın</h2>
            <p>İlk aktivitenizi oluşturmak birkaç dakika sürer. Kayıt gerekmez, hemen deneyin.</p>
            <Link href="/dashboard" className="l-btn-cta">
              Aktivite Oluştur
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M5 11h12m0 0l-4-4m4 4l-4 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="l-footer">
          <p>Wordwall — Eğlenceli öğrenme aktiviteleri oluşturun. <Link href="/dashboard">Uygulamaya Git</Link></p>
        </footer>
      </div>

      <script dangerouslySetInnerHTML={{__html: `
        if (typeof window !== 'undefined') {
          var nb = document.getElementById('l-navbar');
          if (nb) window.addEventListener('scroll', function() {
            nb.classList.toggle('scrolled', window.scrollY > 50);
          });
        }
      `}} />
    </>
  );
}
