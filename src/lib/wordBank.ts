// Artikülasyon terapisi kelime bankası
// Somut, fotoğraflanabilir kelimeler — hedef ses ve hece pozisyonuna göre düzenlenmiş

export type SoundPosition = "basta" | "ortada" | "sonda";

export interface WordEntry {
  word: string;
  // Optional Pexels search hint (defaults to word itself)
  searchHint?: string;
}

export interface SoundData {
  label: string; // Display label e.g. "/r/ sesi"
  positions: Record<SoundPosition, WordEntry[]>;
}

export const POSITION_LABELS: Record<SoundPosition, string> = {
  basta: "Başta",
  ortada: "Ortada",
  sonda: "Sonda",
};

// All target sounds used in Turkish articulation therapy
export const TARGET_SOUNDS: string[] = [
  "r", "s", "z", "ş", "ç", "c", "j",
  "k", "g", "t", "d", "p", "b", "m", "n",
  "l", "f", "v", "h", "y",
];

export const WORD_BANK: Record<string, SoundData> = {
  r: {
    label: "/r/ sesi",
    positions: {
      basta: [
        { word: "rakun", searchHint: "raccoon" },
        { word: "resim", searchHint: "painting" },
        { word: "robot" },
        { word: "roket", searchHint: "rocket" },
        { word: "rüzgar", searchHint: "wind" },
        { word: "radyo", searchHint: "radio" },
        { word: "rende", searchHint: "grater" },
        { word: "renk", searchHint: "color palette" },
        { word: "ruj", searchHint: "lipstick" },
        { word: "rulo", searchHint: "roller" },
      ],
      ortada: [
        { word: "araba", searchHint: "car" },
        { word: "arı", searchHint: "bee" },
        { word: "bardak", searchHint: "glass cup" },
        { word: "karınca", searchHint: "ant" },
        { word: "perde", searchHint: "curtain" },
        { word: "tavşan kurusu", searchHint: "dried fruit" },
        { word: "çorba", searchHint: "soup" },
        { word: "turşu", searchHint: "pickle" },
        { word: "merdiven", searchHint: "stairs" },
        { word: "portakal", searchHint: "orange fruit" },
        { word: "karpuz", searchHint: "watermelon" },
        { word: "fırın", searchHint: "oven" },
        { word: "marangoz", searchHint: "carpenter" },
        { word: "kiraz", searchHint: "cherry" },
        { word: "terazi", searchHint: "scale" },
      ],
      sonda: [
        { word: "asker", searchHint: "soldier" },
        { word: "defter", searchHint: "notebook" },
        { word: "helikopter", searchHint: "helicopter" },
        { word: "traktör", searchHint: "tractor" },
        { word: "şeker", searchHint: "candy" },
        { word: "zencefil şeker", searchHint: "ginger" },
        { word: "asansör", searchHint: "elevator" },
        { word: "profesör", searchHint: "professor" },
        { word: "semaver", searchHint: "samovar" },
        { word: "heykeltraşlar", searchHint: "sculptor" },
      ],
    },
  },

  s: {
    label: "/s/ sesi",
    positions: {
      basta: [
        { word: "saat", searchHint: "clock" },
        { word: "sabun", searchHint: "soap" },
        { word: "sandal", searchHint: "boat" },
        { word: "sandalye", searchHint: "chair" },
        { word: "salıncak", searchHint: "swing" },
        { word: "saksı", searchHint: "flower pot" },
        { word: "salatalık", searchHint: "cucumber" },
        { word: "sepet", searchHint: "basket" },
        { word: "silgi", searchHint: "eraser" },
        { word: "sirk", searchHint: "circus" },
        { word: "simit", searchHint: "simit bagel" },
        { word: "sucuk", searchHint: "sausage" },
        { word: "süt", searchHint: "milk" },
        { word: "su", searchHint: "water" },
        { word: "sincap", searchHint: "squirrel" },
      ],
      ortada: [
        { word: "bisiklet", searchHint: "bicycle" },
        { word: "masa", searchHint: "table" },
        { word: "kasa", searchHint: "safe box" },
        { word: "aslan", searchHint: "lion" },
        { word: "basketbol", searchHint: "basketball" },
        { word: "bıçaksız", searchHint: "knife" },
        { word: "müsait", searchHint: "available" },
        { word: "hastane", searchHint: "hospital" },
        { word: "misafir", searchHint: "guest" },
        { word: "fasulye", searchHint: "bean" },
        { word: "kusursuz", searchHint: "perfect" },
      ],
      sonda: [
        { word: "ananas", searchHint: "pineapple" },
        { word: "autobus", searchHint: "bus" },
        { word: "fanus", searchHint: "lantern" },
        { word: "kaktüs", searchHint: "cactus" },
        { word: "elbise", searchHint: "dress" },
        { word: "nergis", searchHint: "daffodil" },
        { word: "termos", searchHint: "thermos" },
        { word: "fes", searchHint: "fez hat" },
        { word: "mars", searchHint: "mars planet" },
        { word: "papatya vazosu", searchHint: "daisy vase" },
      ],
    },
  },

  z: {
    label: "/z/ sesi",
    positions: {
      basta: [
        { word: "zürafa", searchHint: "giraffe" },
        { word: "zil", searchHint: "bell" },
        { word: "zincir", searchHint: "chain" },
        { word: "zeytin", searchHint: "olive" },
        { word: "zambak", searchHint: "lily flower" },
        { word: "zarf", searchHint: "envelope" },
        { word: "zebra" },
        { word: "zurna", searchHint: "zurna instrument" },
      ],
      ortada: [
        { word: "buzluk", searchHint: "freezer" },
        { word: "gazete", searchHint: "newspaper" },
        { word: "denizaltı", searchHint: "submarine" },
        { word: "yüzük", searchHint: "ring jewelry" },
        { word: "gözlük", searchHint: "glasses" },
        { word: "düzine", searchHint: "dozen" },
        { word: "bozuk para", searchHint: "coins" },
        { word: "kazak", searchHint: "sweater" },
        { word: "muzlu", searchHint: "banana" },
        { word: "tezgah", searchHint: "counter" },
      ],
      sonda: [
        { word: "deniz", searchHint: "sea" },
        { word: "yıldız", searchHint: "star" },
        { word: "beyin cerrahı", searchHint: "brain" },
        { word: "domuz", searchHint: "pig" },
        { word: "buz", searchHint: "ice" },
        { word: "karpuz", searchHint: "watermelon" },
        { word: "kiraz", searchHint: "cherry" },
        { word: "naz", searchHint: "coy" },
        { word: "ayaz", searchHint: "frost" },
      ],
    },
  },

  ş: {
    label: "/ş/ sesi",
    positions: {
      basta: [
        { word: "şapka", searchHint: "hat" },
        { word: "şemsiye", searchHint: "umbrella" },
        { word: "şeker", searchHint: "candy" },
        { word: "şeftali", searchHint: "peach" },
        { word: "şişe", searchHint: "bottle" },
        { word: "şelale", searchHint: "waterfall" },
        { word: "şömine", searchHint: "fireplace" },
        { word: "şal", searchHint: "shawl" },
        { word: "şalgam", searchHint: "turnip" },
        { word: "şato", searchHint: "castle" },
      ],
      ortada: [
        { word: "başak", searchHint: "wheat ear" },
        { word: "bulaşık", searchHint: "dishes" },
        { word: "kuşak", searchHint: "belt" },
        { word: "beşik", searchHint: "cradle" },
        { word: "maşa", searchHint: "tongs" },
        { word: "kaşık", searchHint: "spoon" },
        { word: "fıstık eşi", searchHint: "pistachio" },
        { word: "taşıt", searchHint: "vehicle" },
        { word: "güneşlik", searchHint: "sunshade" },
      ],
      sonda: [
        { word: "kuş", searchHint: "bird" },
        { word: "ayakkabı bağcığı", searchHint: "shoelace" },
        { word: "yağmurluk", searchHint: "raincoat" },
        { word: "güneş", searchHint: "sun" },
        { word: "kaş", searchHint: "eyebrow" },
        { word: "fare tuzağı", searchHint: "mouse trap" },
        { word: "ateş", searchHint: "fire" },
        { word: "baş", searchHint: "head" },
        { word: "taş", searchHint: "stone" },
      ],
    },
  },

  ç: {
    label: "/ç/ sesi",
    positions: {
      basta: [
        { word: "çanta", searchHint: "bag" },
        { word: "çiçek", searchHint: "flower" },
        { word: "çorap", searchHint: "sock" },
        { word: "çilek", searchHint: "strawberry" },
        { word: "çaydanlık", searchHint: "teapot" },
        { word: "çekiç", searchHint: "hammer" },
        { word: "çadır", searchHint: "tent" },
        { word: "çamaşır", searchHint: "laundry" },
        { word: "çit", searchHint: "fence" },
        { word: "çam", searchHint: "pine tree" },
        { word: "çatı", searchHint: "roof" },
        { word: "çizmeler", searchHint: "boots" },
      ],
      ortada: [
        { word: "anahtar çiçeği", searchHint: "key flower" },
        { word: "maçka", searchHint: "cat" },
        { word: "saç kurutma", searchHint: "hair dryer" },
        { word: "uçak", searchHint: "airplane" },
        { word: "bacak", searchHint: "leg" },
        { word: "buçuk", searchHint: "half" },
        { word: "geçit", searchHint: "passage" },
        { word: "koçan", searchHint: "corn cob" },
        { word: "uçurtma", searchHint: "kite" },
        { word: "saçak", searchHint: "eaves" },
      ],
      sonda: [
        { word: "ağaç", searchHint: "tree" },
        { word: "saç", searchHint: "hair" },
        { word: "kulaç", searchHint: "armspan" },
        { word: "koç", searchHint: "ram" },
        { word: "ilaç", searchHint: "medicine" },
        { word: "kalaç", searchHint: "sword" },
        { word: "turunç", searchHint: "bitter orange" },
        { word: "pirinç", searchHint: "rice" },
        { word: "gece lambası", searchHint: "night lamp" },
      ],
    },
  },

  c: {
    label: "/c/ sesi",
    positions: {
      basta: [
        { word: "cep", searchHint: "pocket" },
        { word: "cam", searchHint: "glass window" },
        { word: "ceket", searchHint: "jacket" },
        { word: "ceviz", searchHint: "walnut" },
        { word: "cadde", searchHint: "street" },
        { word: "cami", searchHint: "mosque" },
        { word: "cüzdan", searchHint: "wallet" },
      ],
      ortada: [
        { word: "baca", searchHint: "chimney" },
        { word: "incir", searchHint: "fig" },
        { word: "kucak", searchHint: "lap" },
        { word: "bacak", searchHint: "leg" },
        { word: "buçuk saat", searchHint: "half hour" },
        { word: "sacayağı", searchHint: "tripod" },
        { word: "ücret", searchHint: "payment" },
      ],
      sonda: [
        { word: "ağaç", searchHint: "tree" },
        { word: "tunç", searchHint: "bronze" },
        { word: "pirinç", searchHint: "brass" },
        { word: "ilaç", searchHint: "medicine" },
        { word: "turunç", searchHint: "citrus" },
        { word: "burç", searchHint: "zodiac" },
        { word: "saç", searchHint: "hair" },
      ],
    },
  },

  j: {
    label: "/j/ sesi",
    positions: {
      basta: [
        { word: "jilet", searchHint: "razor blade" },
        { word: "jeton", searchHint: "token coin" },
        { word: "jöle", searchHint: "jelly" },
        { word: "jimnastik", searchHint: "gymnastics" },
        { word: "jambon", searchHint: "ham" },
        { word: "jüri", searchHint: "jury" },
      ],
      ortada: [
        { word: "garaj", searchHint: "garage" },
        { word: "pijama", searchHint: "pajamas" },
        { word: "bijuteri", searchHint: "jewelry" },
        { word: "kamuflaj", searchHint: "camouflage" },
        { word: "plaj", searchHint: "beach" },
      ],
      sonda: [
        { word: "garaj", searchHint: "garage" },
        { word: "masaj", searchHint: "massage" },
        { word: "plaj", searchHint: "beach" },
        { word: "vitraj", searchHint: "stained glass" },
        { word: "montaj", searchHint: "assembly" },
      ],
    },
  },

  k: {
    label: "/k/ sesi",
    positions: {
      basta: [
        { word: "kedi", searchHint: "cat" },
        { word: "kalem", searchHint: "pencil" },
        { word: "kitap", searchHint: "book" },
        { word: "kuş", searchHint: "bird" },
        { word: "köpek", searchHint: "dog" },
        { word: "kelebek", searchHint: "butterfly" },
        { word: "karpuz", searchHint: "watermelon" },
        { word: "kutu", searchHint: "box" },
        { word: "koltuk", searchHint: "armchair" },
        { word: "kamyon", searchHint: "truck" },
        { word: "kapı", searchHint: "door" },
        { word: "kova", searchHint: "bucket" },
        { word: "kurbağa", searchHint: "frog" },
        { word: "kavun", searchHint: "melon" },
        { word: "kukla", searchHint: "puppet" },
      ],
      ortada: [
        { word: "akordeon", searchHint: "accordion" },
        { word: "bakkal", searchHint: "grocery store" },
        { word: "çikolata", searchHint: "chocolate" },
        { word: "lokomotif", searchHint: "locomotive" },
        { word: "mikrofon", searchHint: "microphone" },
        { word: "okul", searchHint: "school" },
        { word: "makarna", searchHint: "pasta" },
        { word: "ekran", searchHint: "screen" },
        { word: "toka", searchHint: "hair clip" },
        { word: "akvaryum", searchHint: "aquarium" },
      ],
      sonda: [
        { word: "bebek", searchHint: "baby" },
        { word: "tabak", searchHint: "plate" },
        { word: "balık", searchHint: "fish" },
        { word: "çakmak", searchHint: "lighter" },
        { word: "ekmek", searchHint: "bread" },
        { word: "yanak", searchHint: "cheek" },
        { word: "bardak", searchHint: "glass" },
        { word: "havluk", searchHint: "towel rack" },
        { word: "dudak", searchHint: "lips" },
        { word: "çiçek", searchHint: "flower" },
      ],
    },
  },

  g: {
    label: "/g/ sesi",
    positions: {
      basta: [
        { word: "gözlük", searchHint: "glasses" },
        { word: "gemi", searchHint: "ship" },
        { word: "gökkuşağı", searchHint: "rainbow" },
        { word: "gitar", searchHint: "guitar" },
        { word: "gül", searchHint: "rose" },
        { word: "gömlek", searchHint: "shirt" },
        { word: "güneş", searchHint: "sun" },
        { word: "gazete", searchHint: "newspaper" },
        { word: "geyik", searchHint: "deer" },
        { word: "gondol", searchHint: "gondola" },
      ],
      ortada: [
        { word: "çiğdem", searchHint: "crocus flower" },
        { word: "değirmen", searchHint: "windmill" },
        { word: "kağıt", searchHint: "paper" },
        { word: "dağ", searchHint: "mountain" },
        { word: "yoğurt", searchHint: "yogurt" },
        { word: "çiğ köfte", searchHint: "raw meatball" },
        { word: "ığdır", searchHint: "igdir city" },
        { word: "bağlama", searchHint: "saz instrument" },
      ],
      sonda: [
        { word: "ayak bileziği", searchHint: "ankle bracelet" },
        { word: "sancak bayrak", searchHint: "flag" },
        { word: "boncuk küpesi", searchHint: "bead earring" },
      ],
    },
  },

  t: {
    label: "/t/ sesi",
    positions: {
      basta: [
        { word: "tarak", searchHint: "comb" },
        { word: "tavşan", searchHint: "rabbit" },
        { word: "televizyon", searchHint: "television" },
        { word: "terazi", searchHint: "scale" },
        { word: "tren", searchHint: "train" },
        { word: "top", searchHint: "ball" },
        { word: "tencere", searchHint: "pot" },
        { word: "tabak", searchHint: "plate" },
        { word: "terlik", searchHint: "slipper" },
        { word: "tırnak", searchHint: "nail" },
        { word: "turp", searchHint: "radish" },
        { word: "tuz", searchHint: "salt" },
        { word: "tahta", searchHint: "board" },
      ],
      ortada: [
        { word: "bitki", searchHint: "plant" },
        { word: "düğme", searchHint: "button" },
        { word: "patates", searchHint: "potato" },
        { word: "otobüs", searchHint: "bus" },
        { word: "çatal", searchHint: "fork" },
        { word: "matara", searchHint: "canteen" },
        { word: "kütük", searchHint: "log" },
        { word: "ütü", searchHint: "iron" },
        { word: "fotoğraf", searchHint: "photograph" },
      ],
      sonda: [
        { word: "kravat", searchHint: "tie" },
        { word: "peynir tabağı", searchHint: "cheese plate" },
        { word: "sepet", searchHint: "basket" },
        { word: "çikolat", searchHint: "chocolate" },
        { word: "ziyaret", searchHint: "visit" },
        { word: "bulut", searchHint: "cloud" },
        { word: "yat", searchHint: "yacht" },
        { word: "at", searchHint: "horse" },
      ],
    },
  },

  d: {
    label: "/d/ sesi",
    positions: {
      basta: [
        { word: "diş", searchHint: "tooth" },
        { word: "dolap", searchHint: "cupboard" },
        { word: "dondurma", searchHint: "ice cream" },
        { word: "deve", searchHint: "camel" },
        { word: "deniz", searchHint: "sea" },
        { word: "davul", searchHint: "drum" },
        { word: "düğme", searchHint: "button" },
        { word: "dürbün", searchHint: "binoculars" },
        { word: "defter", searchHint: "notebook" },
        { word: "damla", searchHint: "drop" },
      ],
      ortada: [
        { word: "buzdolabı", searchHint: "refrigerator" },
        { word: "kadın", searchHint: "woman" },
        { word: "merdiven", searchHint: "stairs" },
        { word: "aydınlık", searchHint: "bright" },
        { word: "ordek", searchHint: "duck" },
        { word: "eldiven", searchHint: "glove" },
        { word: "sedye", searchHint: "stretcher" },
        { word: "madeni para", searchHint: "coin" },
      ],
      sonda: [
        { word: "bulut", searchHint: "cloud" },
        { word: "anahtar", searchHint: "key" },
      ],
    },
  },

  p: {
    label: "/p/ sesi",
    positions: {
      basta: [
        { word: "panda" },
        { word: "patates", searchHint: "potato" },
        { word: "perde", searchHint: "curtain" },
        { word: "pil", searchHint: "battery" },
        { word: "pizza" },
        { word: "portakal", searchHint: "orange" },
        { word: "papağan", searchHint: "parrot" },
        { word: "pasta", searchHint: "cake" },
        { word: "peynir", searchHint: "cheese" },
        { word: "penguen", searchHint: "penguin" },
        { word: "panjur", searchHint: "shutter" },
        { word: "pusula", searchHint: "compass" },
      ],
      ortada: [
        { word: "kapı", searchHint: "door" },
        { word: "çiçekçi dükkanı", searchHint: "flower shop" },
        { word: "tepsi", searchHint: "tray" },
        { word: "papyon", searchHint: "bow tie" },
        { word: "çaput", searchHint: "rag" },
        { word: "kepçe", searchHint: "ladle" },
        { word: "topuk", searchHint: "heel" },
      ],
      sonda: [
        { word: "çorap", searchHint: "sock" },
        { word: "dolap", searchHint: "cupboard" },
        { word: "ip", searchHint: "rope" },
        { word: "kitap", searchHint: "book" },
        { word: "top", searchHint: "ball" },
        { word: "yaprak", searchHint: "leaf" },
        { word: "bardak", searchHint: "glass" },
        { word: "tırnak", searchHint: "nail" },
      ],
    },
  },

  b: {
    label: "/b/ sesi",
    positions: {
      basta: [
        { word: "balon", searchHint: "balloon" },
        { word: "balık", searchHint: "fish" },
        { word: "bardak", searchHint: "glass" },
        { word: "bebek", searchHint: "baby" },
        { word: "bisiklet", searchHint: "bicycle" },
        { word: "bulut", searchHint: "cloud" },
        { word: "böcek", searchHint: "bug insect" },
        { word: "bilezik", searchHint: "bracelet" },
        { word: "bıçak", searchHint: "knife" },
        { word: "burun", searchHint: "nose" },
        { word: "buz", searchHint: "ice" },
        { word: "börek", searchHint: "borek pastry" },
      ],
      ortada: [
        { word: "tabak", searchHint: "plate" },
        { word: "çubuk", searchHint: "stick" },
        { word: "robot" },
        { word: "çiçek bahçesi", searchHint: "flower garden" },
        { word: "kabak", searchHint: "pumpkin" },
        { word: "kibrit", searchHint: "match" },
      ],
      sonda: [
        { word: "kitap", searchHint: "book" },
        { word: "kebap", searchHint: "kebab" },
        { word: "dolap", searchHint: "cupboard" },
        { word: "ip", searchHint: "rope" },
      ],
    },
  },

  m: {
    label: "/m/ sesi",
    positions: {
      basta: [
        { word: "masa", searchHint: "table" },
        { word: "makas", searchHint: "scissors" },
        { word: "mum", searchHint: "candle" },
        { word: "muz", searchHint: "banana" },
        { word: "merdiven", searchHint: "stairs" },
        { word: "mikrofon", searchHint: "microphone" },
        { word: "mısır", searchHint: "corn" },
        { word: "mantar", searchHint: "mushroom" },
        { word: "mendil", searchHint: "handkerchief" },
        { word: "martı", searchHint: "seagull" },
        { word: "mektup", searchHint: "letter" },
        { word: "matkap", searchHint: "drill" },
      ],
      ortada: [
        { word: "çamaşır", searchHint: "laundry" },
        { word: "elma", searchHint: "apple" },
        { word: "kamera", searchHint: "camera" },
        { word: "limon", searchHint: "lemon" },
        { word: "kamelya", searchHint: "camellia" },
        { word: "domates", searchHint: "tomato" },
        { word: "gömlek", searchHint: "shirt" },
        { word: "kumaş", searchHint: "fabric" },
      ],
      sonda: [
        { word: "kalem", searchHint: "pencil" },
        { word: "alem", searchHint: "flag finial" },
        { word: "bilezik kolye", searchHint: "bracelet necklace" },
      ],
    },
  },

  n: {
    label: "/n/ sesi",
    positions: {
      basta: [
        { word: "nar", searchHint: "pomegranate" },
        { word: "nota", searchHint: "music note" },
        { word: "nohut", searchHint: "chickpea" },
        { word: "ney", searchHint: "ney flute" },
        { word: "nane", searchHint: "mint" },
      ],
      ortada: [
        { word: "ananas", searchHint: "pineapple" },
        { word: "kanat", searchHint: "wing" },
        { word: "çanta", searchHint: "bag" },
        { word: "pencere", searchHint: "window" },
        { word: "tencere", searchHint: "pot" },
        { word: "incir", searchHint: "fig" },
        { word: "mandalina", searchHint: "tangerine" },
        { word: "pantolon", searchHint: "pants" },
      ],
      sonda: [
        { word: "aslan", searchHint: "lion" },
        { word: "balon", searchHint: "balloon" },
        { word: "düğün", searchHint: "wedding" },
        { word: "fırın", searchHint: "oven" },
        { word: "limon", searchHint: "lemon" },
        { word: "oyun", searchHint: "game" },
        { word: "tavşan", searchHint: "rabbit" },
        { word: "yastık kılıfı", searchHint: "pillow" },
      ],
    },
  },

  l: {
    label: "/l/ sesi",
    positions: {
      basta: [
        { word: "lamba", searchHint: "lamp" },
        { word: "limon", searchHint: "lemon" },
        { word: "lokomotif", searchHint: "locomotive" },
        { word: "lale", searchHint: "tulip" },
        { word: "lastik", searchHint: "tire" },
        { word: "lavabo", searchHint: "sink" },
        { word: "leğen", searchHint: "basin" },
      ],
      ortada: [
        { word: "balon", searchHint: "balloon" },
        { word: "dolap", searchHint: "cupboard" },
        { word: "kalem", searchHint: "pencil" },
        { word: "kelebek", searchHint: "butterfly" },
        { word: "salıncak", searchHint: "swing" },
        { word: "televizyon", searchHint: "television" },
        { word: "bulaşık", searchHint: "dishes" },
        { word: "bilezik", searchHint: "bracelet" },
        { word: "pelikan", searchHint: "pelican" },
      ],
      sonda: [
        { word: "bal", searchHint: "honey" },
        { word: "fil", searchHint: "elephant" },
        { word: "gül", searchHint: "rose" },
        { word: "okul", searchHint: "school" },
        { word: "tünel", searchHint: "tunnel" },
        { word: "sandal", searchHint: "boat" },
        { word: "zil", searchHint: "bell" },
        { word: "yol", searchHint: "road" },
      ],
    },
  },

  f: {
    label: "/f/ sesi",
    positions: {
      basta: [
        { word: "fare", searchHint: "mouse" },
        { word: "fener", searchHint: "lantern" },
        { word: "fırın", searchHint: "oven" },
        { word: "fındık", searchHint: "hazelnut" },
        { word: "fil", searchHint: "elephant" },
        { word: "fotoğraf", searchHint: "photo" },
        { word: "flüt", searchHint: "flute" },
        { word: "fincan", searchHint: "cup" },
      ],
      ortada: [
        { word: "çifte", searchHint: "double" },
        { word: "defter", searchHint: "notebook" },
        { word: "kafes", searchHint: "cage" },
        { word: "sofra", searchHint: "dining table" },
        { word: "tüfek", searchHint: "rifle" },
      ],
      sonda: [
        { word: "dürbün dükkânı", searchHint: "binoculars shop" },
        { word: "zürafa", searchHint: "giraffe" },
        { word: "raf", searchHint: "shelf" },
        { word: "elif", searchHint: "elif letter" },
      ],
    },
  },

  v: {
    label: "/v/ sesi",
    positions: {
      basta: [
        { word: "vazo", searchHint: "vase" },
        { word: "valiz", searchHint: "suitcase" },
        { word: "vanilya", searchHint: "vanilla" },
        { word: "ventilator", searchHint: "fan" },
        { word: "vidalı", searchHint: "screw" },
        { word: "vinç", searchHint: "crane" },
      ],
      ortada: [
        { word: "deve", searchHint: "camel" },
        { word: "havlu", searchHint: "towel" },
        { word: "tavuk", searchHint: "chicken" },
        { word: "kavun", searchHint: "melon" },
        { word: "havuç", searchHint: "carrot" },
        { word: "akvaryum", searchHint: "aquarium" },
        { word: "tavla", searchHint: "backgammon" },
      ],
      sonda: [
        { word: "ev", searchHint: "house" },
        { word: "halı saha", searchHint: "football field" },
      ],
    },
  },

  h: {
    label: "/h/ sesi",
    positions: {
      basta: [
        { word: "havuç", searchHint: "carrot" },
        { word: "havlu", searchHint: "towel" },
        { word: "halı", searchHint: "carpet" },
        { word: "helikopter", searchHint: "helicopter" },
        { word: "hamak", searchHint: "hammock" },
        { word: "harfler", searchHint: "letters alphabet" },
        { word: "havuz", searchHint: "pool" },
        { word: "horoz", searchHint: "rooster" },
        { word: "hediye", searchHint: "gift" },
      ],
      ortada: [
        { word: "bahçe", searchHint: "garden" },
        { word: "lahana", searchHint: "cabbage" },
        { word: "kahve", searchHint: "coffee" },
        { word: "tahta", searchHint: "board" },
        { word: "sihirbaz", searchHint: "magician" },
        { word: "rahle", searchHint: "book stand" },
      ],
      sonda: [
        { word: "tezgah", searchHint: "counter" },
      ],
    },
  },

  y: {
    label: "/y/ sesi",
    positions: {
      basta: [
        { word: "yılan", searchHint: "snake" },
        { word: "yıldız", searchHint: "star" },
        { word: "yüzük", searchHint: "ring" },
        { word: "yaprak", searchHint: "leaf" },
        { word: "yastık", searchHint: "pillow" },
        { word: "yumurta", searchHint: "egg" },
        { word: "yengeç", searchHint: "crab" },
        { word: "yelpaze", searchHint: "fan" },
        { word: "yay", searchHint: "bow archery" },
        { word: "yoğurt", searchHint: "yogurt" },
      ],
      ortada: [
        { word: "ayak", searchHint: "foot" },
        { word: "boya", searchHint: "paint" },
        { word: "kayak", searchHint: "ski" },
        { word: "mayıs böceği", searchHint: "ladybug" },
        { word: "koyun", searchHint: "sheep" },
        { word: "ayna", searchHint: "mirror" },
        { word: "bayrak", searchHint: "flag" },
        { word: "oyuncak", searchHint: "toy" },
      ],
      sonda: [
        { word: "ay", searchHint: "moon" },
        { word: "yay", searchHint: "bow" },
        { word: "sandalye", searchHint: "chair" },
        { word: "anahtar", searchHint: "key" },
      ],
    },
  },
};

/**
 * Get words for a given sound and optional position filter
 */
export function getWords(
  sound: string,
  position?: SoundPosition
): WordEntry[] {
  const data = WORD_BANK[sound];
  if (!data) return [];
  if (position) return data.positions[position] ?? [];
  // Return all positions combined
  return [
    ...data.positions.basta,
    ...data.positions.ortada,
    ...data.positions.sonda,
  ];
}

/**
 * Get count of words per position for a given sound
 */
export function getWordCounts(sound: string): Record<SoundPosition, number> {
  const data = WORD_BANK[sound];
  if (!data) return { basta: 0, ortada: 0, sonda: 0 };
  return {
    basta: data.positions.basta.length,
    ortada: data.positions.ortada.length,
    sonda: data.positions.sonda.length,
  };
}
