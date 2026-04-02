-- 18 official templates for speech therapy

-- Artikulasyon (3)
INSERT INTO templates (title, description, type, theme, options, category, tags, source, is_premium, author_name) VALUES
(
  '/s/ sesi kelime başı eşleştirme',
  '5-7 yaş grubu için /s/ sesi hedefleyen eşleştirme etkinliği. Kelime başı pozisyonunda /s/ sesi içeren kelimeler.',
  'match', 'fruits',
  '[{"id":"s1","text":"Su","pairText":"Bardak"},{"id":"s2","text":"Saat","pairText":"Zaman"},{"id":"s3","text":"Sabun","pairText":"Temizlik"},{"id":"s4","text":"Sandal","pairText":"Deniz"},{"id":"s5","text":"Sepet","pairText":"Meyve"},{"id":"s6","text":"Silgi","pairText":"Kalem"},{"id":"s7","text":"Simit","pairText":"Yiyecek"},{"id":"s8","text":"Süpürge","pairText":"Temizlik"}]'::jsonb,
  'artikulasyon', ARRAY['s-sesi','5-7-yas','eslestirme','kelime-basi'], 'official', false, null
),
(
  '/r/ sesi balon patlatma',
  '/r/ sesi içeren kelimeleri hedefleyen eğlenceli balon patlatma oyunu.',
  'balloon-pop', 'aliens',
  '[{"id":"r1","text":"Araba","isCorrect":true},{"id":"r2","text":"Kalem","isCorrect":false},{"id":"r3","text":"Bardak","isCorrect":true},{"id":"r4","text":"Masa","isCorrect":false},{"id":"r5","text":"Portakal","isCorrect":true},{"id":"r6","text":"Kitap","isCorrect":false},{"id":"r7","text":"Karanlık","isCorrect":true},{"id":"r8","text":"Resim","isCorrect":true},{"id":"r9","text":"Top","isCorrect":false},{"id":"r10","text":"Tavuk","isCorrect":false}]'::jsonb,
  'artikulasyon', ARRAY['r-sesi','balon','artikulasyon'], 'official', false, null
),
(
  '/k/ sesi hafıza oyunu',
  '/k/ sesi içeren kelimeleri pekiştirmek için hafıza kartı oyunu.',
  'memory', 'blue',
  '[{"id":"k1","text":"Kedi"},{"id":"k2","text":"Kutu"},{"id":"k3","text":"Kapı"},{"id":"k4","text":"Kalem"},{"id":"k5","text":"Koltuk"},{"id":"k6","text":"Kukla"}]'::jsonb,
  'artikulasyon', ARRAY['k-sesi','hafiza','artikulasyon'], 'official', true, null
);

-- Kelime Hazinesi (3)
INSERT INTO templates (title, description, type, theme, options, category, tags, source, is_premium, author_name) VALUES
(
  'Hayvanlar gruplama',
  'Hayvanları yaşadıkları yerlere göre grupla: evcil, yabani, çiftlik.',
  'group-sort', 'farm',
  '[{"id":"h1","text":"Kedi","group":"Evcil"},{"id":"h2","text":"Aslan","group":"Yabani"},{"id":"h3","text":"İnek","group":"Çiftlik"},{"id":"h4","text":"Köpek","group":"Evcil"},{"id":"h5","text":"Kaplan","group":"Yabani"},{"id":"h6","text":"Tavuk","group":"Çiftlik"},{"id":"h7","text":"Balık","group":"Evcil"},{"id":"h8","text":"Fil","group":"Yabani"},{"id":"h9","text":"Koyun","group":"Çiftlik"}]'::jsonb,
  'kelime-hazinesi', ARRAY['hayvanlar','gruplama','kelime'], 'official', false, null
),
(
  'Meyve-sebze eşleştirme',
  'Meyve ve sebze isimlerini tanımlarıyla eşleştirme.',
  'match', 'fruits',
  '[{"id":"ms1","text":"Elma","pairText":"Kırmızı meyve"},{"id":"ms2","text":"Havuç","pairText":"Turuncu sebze"},{"id":"ms3","text":"Muz","pairText":"Sarı meyve"},{"id":"ms4","text":"Domates","pairText":"Kırmızı sebze"},{"id":"ms5","text":"Üzüm","pairText":"Mor meyve"},{"id":"ms6","text":"Biber","pairText":"Yeşil sebze"}]'::jsonb,
  'kelime-hazinesi', ARRAY['meyve','sebze','eslestirme'], 'official', true, null
),
(
  'Vücut bölümleri quiz',
  'Vücut bölümlerini tanıma ve isimlendirme quiz oyunu.',
  'quiz', 'classroom',
  '[{"id":"v1","text":"Göz","isCorrect":true},{"id":"v2","text":"Kulak","isCorrect":false},{"id":"v3","text":"Burun","isCorrect":false},{"id":"v4","text":"Ağız","isCorrect":false}]'::jsonb,
  'kelime-hazinesi', ARRAY['vucut','quiz','kelime'], 'official', false, null
);

-- Gramer (3)
INSERT INTO templates (title, description, type, theme, options, category, tags, source, is_premium, author_name) VALUES
(
  'Çoğul eki boşluk doldurma',
  'Cümlelerdeki boşluğu doğru çoğul ekiyle tamamla.',
  'missing-word', 'classroom',
  '[{"id":"c1","text":"ağaçlar","isCorrect":true},{"id":"c2","text":"ağaç","isCorrect":false},{"id":"c3","text":"ağaçlık","isCorrect":false}]'::jsonb,
  'gramer', ARRAY['cogul','ek','gramer'], 'official', false, null
),
(
  'Geçmiş zaman quiz',
  'Doğru geçmiş zaman fiil çekimini seçme oyunu.',
  'quiz', 'cars',
  '[{"id":"g1","text":"gitti","isCorrect":true},{"id":"g2","text":"gider","isCorrect":false},{"id":"g3","text":"gidecek","isCorrect":false},{"id":"g4","text":"gidiyor","isCorrect":false}]'::jsonb,
  'gramer', ARRAY['gecmis-zaman','fiil','gramer'], 'official', true, null
),
(
  'Büyük-küçük gruplama',
  'Sıfatları büyük ve küçük gruplarına ayır.',
  'group-sort', 'treasure',
  '[{"id":"bk1","text":"Dev","group":"Büyük"},{"id":"bk2","text":"Minik","group":"Küçük"},{"id":"bk3","text":"Kocaman","group":"Büyük"},{"id":"bk4","text":"Ufak","group":"Küçük"},{"id":"bk5","text":"İri","group":"Büyük"},{"id":"bk6","text":"Küçücük","group":"Küçük"}]'::jsonb,
  'gramer', ARRAY['sifat','gruplama','gramer'], 'official', false, null
);

-- Dil Anlama (3)
INSERT INTO templates (title, description, type, theme, options, category, tags, source, is_premium, author_name) VALUES
(
  'Zıt anlamlılar eşleştirme',
  'Zıt anlamlı kelimeleri birbiriyle eşleştir.',
  'match', 'pink',
  '[{"id":"z1","text":"Sıcak","pairText":"Soğuk"},{"id":"z2","text":"Büyük","pairText":"Küçük"},{"id":"z3","text":"Hızlı","pairText":"Yavaş"},{"id":"z4","text":"Uzun","pairText":"Kısa"},{"id":"z5","text":"Açık","pairText":"Kapalı"},{"id":"z6","text":"Mutlu","pairText":"Üzgün"}]'::jsonb,
  'anlama', ARRAY['zit-anlam','eslestirme','anlama'], 'official', false, null
),
(
  'Ne ile ne yaparız?',
  'Nesneleri kullanımlarıyla eşleştirme quiz oyunu.',
  'quiz', 'classroom',
  '[{"id":"n1","text":"Keseriz","isCorrect":true},{"id":"n2","text":"Yazarız","isCorrect":false},{"id":"n3","text":"Boyarız","isCorrect":false},{"id":"n4","text":"Yeriz","isCorrect":false}]'::jsonb,
  'anlama', ARRAY['nesne','islev','anlama'], 'official', true, null
),
(
  'Günlük rutin sıralama',
  'Sabah, öğle ve akşam rutinlerini doğru gruba yerleş.',
  'group-sort', 'classroom',
  '[{"id":"sr1","text":"Diş fırçala","group":"Sabah"},{"id":"sr2","text":"Öğle yemeği","group":"Öğle"},{"id":"sr3","text":"Pijama giy","group":"Akşam"},{"id":"sr4","text":"Kahvaltı","group":"Sabah"},{"id":"sr5","text":"Teneffüs","group":"Öğle"},{"id":"sr6","text":"Masal dinle","group":"Akşam"}]'::jsonb,
  'anlama', ARRAY['rutin','siralama','gunluk'], 'official', false, null
);

-- Sosyal Iletisim (3)
INSERT INTO templates (title, description, type, theme, options, category, tags, source, is_premium, author_name) VALUES
(
  'Duygu eşleştirme',
  'Yüz ifadelerini duygu isimleriyle eşleştir.',
  'match', 'pink',
  '[{"id":"d1","text":"😊","pairText":"Mutlu"},{"id":"d2","text":"😢","pairText":"Üzgün"},{"id":"d3","text":"😠","pairText":"Kızgın"},{"id":"d4","text":"😨","pairText":"Korkmuş"},{"id":"d5","text":"😮","pairText":"Şaşırmış"},{"id":"d6","text":"😴","pairText":"Uykulu"}]'::jsonb,
  'sosyal-iletisim', ARRAY['duygu','eslestirme','sosyal'], 'official', false, null
),
(
  'Ne hisseder?',
  'Verilen senaryoda kişinin ne hissettiğini tahmin et.',
  'quiz', 'pink',
  '[{"id":"nh1","text":"Mutlu","isCorrect":true},{"id":"nh2","text":"Kızgın","isCorrect":false},{"id":"nh3","text":"Korkmuş","isCorrect":false},{"id":"nh4","text":"Üzgün","isCorrect":false}]'::jsonb,
  'sosyal-iletisim', ARRAY['duygu','senaryo','sosyal'], 'official', true, null
),
(
  'Kibarlık kelimeleri balon patlatma',
  'Kibar ifadeleri içeren balonları patlat, kabaları bırak.',
  'balloon-pop', 'farm',
  '[{"id":"kb1","text":"Lütfen","isCorrect":true},{"id":"kb2","text":"Teşekkürler","isCorrect":true},{"id":"kb3","text":"Ver bana!","isCorrect":false},{"id":"kb4","text":"Rica ederim","isCorrect":true},{"id":"kb5","text":"İstemiyorum!","isCorrect":false},{"id":"kb6","text":"Pardon","isCorrect":true},{"id":"kb7","text":"Çekil!","isCorrect":false},{"id":"kb8","text":"Özür dilerim","isCorrect":true}]'::jsonb,
  'sosyal-iletisim', ARRAY['kibarlik','balon','sosyal'], 'official', false, null
);

-- Diger (3)
INSERT INTO templates (title, description, type, theme, options, category, tags, source, is_premium, author_name) VALUES
(
  'Renkler çarkı',
  'Renk isimlerini öğrenme ve pekiştirme çarkı.',
  'wheel', 'fruits',
  '[{"id":"rc1","text":"Kırmızı"},{"id":"rc2","text":"Mavi"},{"id":"rc3","text":"Yeşil"},{"id":"rc4","text":"Sarı"},{"id":"rc5","text":"Turuncu"},{"id":"rc6","text":"Mor"},{"id":"rc7","text":"Pembe"},{"id":"rc8","text":"Beyaz"}]'::jsonb,
  'diger', ARRAY['renkler','cark','genel'], 'official', false, null
),
(
  'Haftanın günleri hafıza',
  'Haftanın günlerini eşleştirerek öğren.',
  'memory', 'blue',
  '[{"id":"hg1","text":"Pazartesi"},{"id":"hg2","text":"Salı"},{"id":"hg3","text":"Çarşamba"},{"id":"hg4","text":"Perşembe"},{"id":"hg5","text":"Cuma"},{"id":"hg6","text":"Cumartesi"},{"id":"hg7","text":"Pazar"}]'::jsonb,
  'diger', ARRAY['gunler','hafiza','genel'], 'official', true, null
),
(
  'Sayılar 1-10 kart açma',
  'Sayıları 1den 10a kadar kartlarla öğren.',
  'card', 'cars',
  '[{"id":"sy1","text":"1 - Bir"},{"id":"sy2","text":"2 - İki"},{"id":"sy3","text":"3 - Üç"},{"id":"sy4","text":"4 - Dört"},{"id":"sy5","text":"5 - Beş"},{"id":"sy6","text":"6 - Altı"},{"id":"sy7","text":"7 - Yedi"},{"id":"sy8","text":"8 - Sekiz"},{"id":"sy9","text":"9 - Dokuz"},{"id":"sy10","text":"10 - On"}]'::jsonb,
  'diger', ARRAY['sayilar','kart','genel'], 'official', false, null
);
