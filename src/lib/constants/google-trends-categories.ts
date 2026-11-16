export interface GoogleTrendsCategoryOption {
  id: number;
  slug: string;
  name: string;
  icon: string;
  description: string;
}

/**
 * Categorias oficiais utilizadas pelo Google Trends no feed "Trending Now" (IDs 1 a 20).
 */
export const GOOGLE_TRENDS_CATEGORIES: GoogleTrendsCategoryOption[] = [
  { id: 3, slug: "business", name: "Negócios e Finanças", icon: "💼", description: "Mercado financeiro, empresas, economia e gestão" },
  { id: 18, slug: "technology", name: "Tecnologia", icon: "💻", description: "Software, IA, computação, eletrônicos e internet" },
  { id: 2, slug: "beauty", name: "Beleza e Moda", icon: "💄", description: "Cosméticos, vestuário, estilo e estética" },
  { id: 5, slug: "food", name: "Alimentos e Bebidas", icon: "🍔", description: "Restaurantes, culinária, gastronomia e bebidas" },
  { id: 7, slug: "health", name: "Saúde e Bem-estar", icon: "🩺", description: "Medicina, clínicas, fitness e qualidade de vida" },
  { id: 16, slug: "shopping", name: "Compras e Varejo", icon: "🛍️", description: "E-commerce, lojas, produtos e consumo" },
  { id: 1, slug: "autos", name: "Autos e Veículos", icon: "🚗", description: "Automóveis, oficinas, transporte e peças" },
  { id: 9, slug: "education", name: "Empregos e Educação", icon: "🎓", description: "Cursos, carreira, vagas, faculdades e concursos" },
  { id: 19, slug: "travel", name: "Viagens e Turismo", icon: "✈️", description: "Hotéis, turismo, destinos e companhias aéreas" },
  { id: 8, slug: "hobbies", name: "Hobbies e Lazer", icon: "🎨", description: "Artesanato, música, fotografia e entretenimento caseiro" },
  { id: 13, slug: "pets", name: "Animais e Pets", icon: "🐾", description: "Veterinária, pet shops, cuidados animais" },
  { id: 4, slug: "entertainment", name: "Entretenimento", icon: "🎭", description: "Cinema, TV, celebridades, música e cultura pop" },
  { id: 17, slug: "sports", name: "Esportes", icon: "⚽", description: "Futebol, campeonatos, atletas e modalidades" },
  { id: 15, slug: "science", name: "Ciência", icon: "🔬", description: "Pesquisas, astronomia, descobertas e biologia" },
  { id: 20, slug: "climate", name: "Clima e Meio Ambiente", icon: "🌦️", description: "Previsão do tempo, sustentabilidade e natureza" },
  { id: 10, slug: "law", name: "Legislação e Governo", icon: "⚖️", description: "Direito, tribunais, leis e órgãos públicos" },
  { id: 14, slug: "politics", name: "Política", icon: "🏛️", description: "Eleições, partidos, políticas públicas e geopolítica" },
  { id: 6, slug: "games", name: "Jogos e Games", icon: "🎮", description: "Videogames, e-sports, consoles e lançamentos" },
  { id: 11, slug: "other", name: "Outros / Geral", icon: "🌐", description: "Tópicos gerais e tendências variadas" },
];

export function getGoogleTrendsCategoryById(
  id: number | string | undefined | null
): GoogleTrendsCategoryOption | undefined {
  if (id === undefined || id === null || id === "") return undefined;
  const numId = typeof id === "string" ? parseInt(id, 10) : id;
  if (isNaN(numId)) return undefined;
  return GOOGLE_TRENDS_CATEGORIES.find((c) => c.id === numId);
}

export function getGoogleTrendsCategoryBySlug(
  slug: string | undefined | null
): GoogleTrendsCategoryOption | undefined {
  if (!slug) return undefined;
  const clean = slug.toLowerCase().trim();
  return GOOGLE_TRENDS_CATEGORIES.find((c) => c.slug === clean);
}
