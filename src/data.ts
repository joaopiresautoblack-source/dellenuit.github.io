import { Product, SensoryQuizQuestion } from "./types";

export const PRODUCTS: Product[] = [];

export const EXAMPLE_PRODUCTS: Product[] = [
  {
    id: "conjunto-noir",
    name: "Conjunto Noir Luxo em Renda Chantilly",
    category: "Lingerie",
    price: 249.90,
    description: "Sutiã meia-taça estruturado com aro e calcinha fio duplo em sofisticada renda Chantilly. Detalhes em metais banhados a ouro 24k.",
    image: "https://images.unsplash.com/photo-1618220179428-22790b461013?w=600&auto=format&fit=crop&q=80",
    rating: 4.9,
    reviewsCount: 124,
    sizes: ["P", "M", "G", "GG"],
    colors: ["Preto Absoluto", "Vinho Bourbon", "Branco Off-White"],
    details: [
      "Renda macia com elastano (não pinica)",
      "Aro de sustentação confortável sem bojo rígido",
      "Alças reguláveis de 10mm com toque de cetim",
      "Forro da calcinha 100% algodão hipoalergênico"
    ],
    tag: "Mais Vendido"
  },
  {
    id: "robe-cetim-amore",
    name: "Robe Longo em Cetim Premium com Detalhe Guipir",
    category: "Lingerie",
    price: 189.90,
    description: "Robe longo confeccionado em cetim de seda de toque gélido e brilho sutil. Mangas decoradas com renda Guipir aplicada à mão.",
    image: "https://images.unsplash.com/photo-1582533561751-ef6f6ab93a2e?w=600&auto=format&fit=crop&q=80",
    rating: 4.8,
    reviewsCount: 86,
    sizes: ["M", "G", "GG"],
    colors: ["Bordeaux", "Champagne", "Preto"],
    details: [
      "Tecido leve com caimento fluido",
      "Acompanha faixa interna e externa para ajuste perfeito",
      "Ideal para momentos pós-banho ou noites especiais",
      "Costuras embutidas com acabamento de alta costura"
    ],
    tag: "Luxo"
  },
  {
    id: "vela-sensorial-baunilha",
    name: "Vela de Massagem Aromática Warm Touch",
    category: "Sex Shop",
    price: 79.90,
    description: "Vela aromática feita com ceras vegetais e manteiga de karité pura. Ao derreter, transforma-se em um óleo morno e altamente hidratante para massagem corporal.",
    image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=600&auto=format&fit=crop&q=80",
    rating: 5.0,
    reviewsCount: 215,
    sizes: ["120g"],
    colors: ["Baunilha & Ylang Ylang", "Cereja Negra", "Lavanda Amadeirada"],
    details: [
      "Ponto de fusão baixo (não queima a pele)",
      "Livre de parafinas e derivados de petróleo",
      "Fragrância afrodisíaca de óleos essenciais puros",
      "Bico dosador no frasco de cerâmica para fácil aplicação"
    ],
    tag: "Favorito"
  },
  {
    id: "oleo-lubrificante-nectar",
    name: "Néctar Hidratante Íntimo Hidrossolúvel",
    category: "Sex Shop",
    price: 64.90,
    description: "Gel umectante premium à base de água, enriquecido com aloe vera e extrato de ginseng. Oferece lubrificação de longa duração e toque aveludado.",
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&auto=format&fit=crop&q=80",
    rating: 4.7,
    reviewsCount: 92,
    sizes: ["80ml"],
    colors: ["Neutro", "Efeito Quente (Warm)", "Menta Refrescante"],
    details: [
      "Compatível com preservativos e acessórios de silicone",
      "pH balanceado compatível com a flora íntima",
      "Fórmula não gordurosa e fácil de remover com água",
      "Livre de parabenos, fragrâncias artificiais e corantes"
    ],
    tag: "Essencial"
  },
  {
    id: "conjunto-red-velvet",
    name: "Conjunto Red Velvet Sensual e Tule",
    category: "Lingerie",
    price: 219.90,
    description: "Uma fusão audaciosa de veludo premium vermelho-cardeal e tule ultra-fino transparente. Desenho geométrico que valoriza as curvas.",
    image: "https://images.unsplash.com/photo-1508427953056-b00b8d78ecf5?w=600&auto=format&fit=crop&q=80",
    rating: 4.9,
    reviewsCount: 63,
    sizes: ["P", "M", "G"],
    colors: ["Vermelho Escarlate", "Esmeralda Profundo", "Preto"],
    details: [
      "Tiras ajustáveis estilo strappy no colo",
      "Fecho traseiro triplo para ajuste perfeito",
      "Calcinha regulável nas laterais",
      "Toque macio com tule elástico de alta densidade"
    ],
    tag: "Novidade"
  },
  {
    id: "bodysuit-aurora",
    name: "Body de Renda Aurora com Costas Decotadas",
    category: "Lingerie",
    price: 199.90,
    description: "Body sensual todo em renda de padrão floral exclusivo. Decote profundo nas costas e gola alta delicada com abotoamento.",
    image: "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=600&auto=format&fit=crop&q=80",
    rating: 4.8,
    reviewsCount: 77,
    sizes: ["P", "M", "G", "GG"],
    colors: ["Verde Petróleo", "Preto Mistério", "Branco Noiva"],
    details: [
      "Sem aro e sem bojo para conforto total",
      "Fecho inferior prático com três regulagens",
      "Renda inteligente que se molda às curvas",
      "Perfeito para usar em momentos íntimos ou looks outwear"
    ],
    tag: "Tendência"
  },
  {
    id: "massageador-pulso-aurora",
    name: "Estimulador Clínico de Ondas de Pulso LUNA",
    category: "Sex Shop",
    price: 349.90,
    description: "Estimulador recarregável por indução, projetado com silicone de grau médico aveludado. Tecnologia silenciosa de pulsação de ar para toques precisos de bem-estar.",
    image: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=600&auto=format&fit=crop&q=80",
    rating: 4.9,
    reviewsCount: 148,
    sizes: ["Tamanho Único"],
    colors: ["Rosa Quartz", "Roxo Orquídea", "Azul Noturno"],
    details: [
      "10 padrões de pulsação e ondas de pressão de ar sônicas",
      "100% à prova d'água (IPX7) para momentos relaxantes na banheira",
      "Motor Whisper-Quiet (menos de 40dB) extremamente discreto",
      "Carga rápida magnética via USB com duração de até 2 horas de uso contínuo"
    ],
    tag: "Tecnologia"
  },
  {
    id: "kit-sensorial-massagem",
    name: "Kit Spa Sensorial e Vendas de Cetim",
    category: "Sex Shop",
    price: 119.90,
    description: "O conjunto perfeito para despertar os sentidos. Inclui venda acolchoada de cetim premium, espanador de plumas naturais suaves e sachê perfumado relaxante.",
    image: "https://images.unsplash.com/photo-1618220179428-22790b461013?w=600&auto=format&fit=crop&q=80",
    rating: 4.6,
    reviewsCount: 39,
    sizes: ["Kit Completo"],
    colors: ["Preto Acetinado", "Vermelho Paixão"],
    details: [
      "Venda com elástico confortável que não aperta a cabeça",
      "Espanador de plumas macias para carícias sensoriais leves",
      "Ideal para casais explorarem o tato e o olfato",
      "Embalado em saquinho de organza luxuoso para guardar de forma discreta"
    ],
    tag: "Sensual"
  }
];

export const SENSORY_QUIZ: SensoryQuizQuestion[] = [
  {
    id: 1,
    text: "Qual é o seu principal desejo ou objetivo hoje?",
    options: [
      { text: "Conforto absoluto com um toque de elegância", value: "Lingerie", description: "Desejo relaxar e me sentir bela(o) de forma confortável." },
      { text: "Surpreender e inovar em uma noite a dois especial", value: "Lingerie", description: "Procurando lingeries sofisticadas e marcantes." },
      { text: "Explorar o autocuidado, aromaterapia e toque", value: "Sex Shop", description: "Focado em rituais de massagem, aromas e hidratação íntima." },
      { text: "Descobrir novas sensações físicas e divertidas", value: "Sex Shop", description: "Interesse em explorar vibrações, pulsações e tecnologia sensorial." }
    ]
  },
  {
    id: 2,
    text: "Quais materiais ou texturas mais agradam seu corpo?",
    options: [
      { text: "Renda floral delicada e transparências", value: "renda", description: "Clássico, romântico e intrigante." },
      { text: "Cetim fluido, liso e com toque geladinho", value: "cetim", description: "Elegante, luxuoso e suave." },
      { text: "Óleos mornos que derretem na pele e hidratam", value: "vela", description: "Sensorial, envolvente e acolhedor." },
      { text: "Silicone macio de toque ultra aveludado", value: "silicone", description: "Moderno, preciso e higiênico." }
    ]
  },
  {
    id: 3,
    text: "Como seria a atmosfera ideal para o seu momento perfeito?",
    options: [
      { text: "Luz suave de velas, aromas doces e música relaxante", value: "Sex Shop", description: "Uma noite de spa e autocuidado completo." },
      { text: "Um quarto sofisticado com lençóis de seda e luz baixa", value: "Lingerie", description: "O aconchego do luxo discreto." },
      { text: "Uma brincadeira divertida de mistério com olhos vendados", value: "Sex Shop", description: "Despertar da audição e do tato às cegas." },
      { text: "O impacto visual de uma lingerie vermelha ou preta deslumbrante", value: "Lingerie", description: "Empoderamento e magnetismo visual." }
    ]
  }
];
