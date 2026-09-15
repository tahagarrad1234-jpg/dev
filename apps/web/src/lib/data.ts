export type Category = "All pieces" | "Dress" | "Field" | "Diver" | "Chronograph";
export type Product = {
  id: number;
  name: string;
  collection: string;
  category: Exclude<Category, "All pieces">;
  price: number;
  image: string;
  tone: string;
  description: string;
};
export type CartItem = Product & { quantity: number };

export const products: Product[] = [
  {
    id: 1,
    name: "The Meridian",
    collection: "No. 01 / Automatic",
    category: "Dress",
    price: 1240,
    image:
      "https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=1200",
    tone: "bone",
    description:
      "A quietly proportioned automatic in brushed steel and warm ivory.",
  },
  {
    id: 2,
    name: "Aster 38",
    collection: "No. 02 / Hand-wound",
    category: "Dress",
    price: 980,
    image:
      "https://images.pexels.com/photos/277390/pexels-photo-277390.jpeg?auto=compress&cs=tinysrgb&w=1200",
    tone: "ink",
    description:
      "A slender silhouette with a midnight dial and hand-finished indices.",
  },
  {
    id: 3,
    name: "Field Note",
    collection: "No. 03 / Mechanical",
    category: "Field",
    price: 745,
    image:
      "https://images.pexels.com/photos/1697214/pexels-photo-1697214.jpeg?auto=compress&cs=tinysrgb&w=1200",
    tone: "olive",
    description:
      "Built for the long way around, with a legible dial and canvas strap.",
  },
  {
    id: 4,
    name: "The Deep 200",
    collection: "No. 04 / Diver",
    category: "Diver",
    price: 1680,
    image:
      "https://images.pexels.com/photos/364822/pexels-photo-364822.jpeg?auto=compress&cs=tinysrgb&w=1200",
    tone: "rust",
    description:
      "A disciplined tool watch with a ceramic bezel and 200m resistance.",
  },
  {
    id: 5,
    name: "Civic Timer",
    collection: "No. 05 / Chronograph",
    category: "Chronograph",
    price: 1890,
    image:
      "https://images.pexels.com/photos/47856/rolex-watch-time-luxury-47856.jpeg?auto=compress&cs=tinysrgb&w=1200",
    tone: "sand",
    description:
      "A measured chronograph for days that deserve to be remembered.",
  },
  {
    id: 6,
    name: "Solstice 34",
    collection: "No. 06 / Quartz",
    category: "Dress",
    price: 590,
    image:
      "https://images.pexels.com/photos/280250/pexels-photo-280250.jpeg?auto=compress&cs=tinysrgb&w=1200",
    tone: "blue",
    description: "A compact everyday companion with a sun-washed blue dial.",
  },
];

export const money = (value: number) =>
  `$${value.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
