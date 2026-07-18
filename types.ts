export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image: string;
  images?: string[];
  rating: number;
  reviewsCount: number;
  sizes: string[];
  colors: string[];
  details: string[];
  tag?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
}

export interface SensoryQuizQuestion {
  id: number;
  text: string;
  options: {
    text: string;
    value: string;
    description: string;
  }[];
}
