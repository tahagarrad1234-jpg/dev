import { db, pool } from "./index";
import { amalProducts } from "./schema";

const products = [
  {
    name: "The Meridian",
    collection: "No. 01 / Automatic",
    category: "Dress",
    price: 1240,
    image:
      "https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=1200",
    tone: "bone",
    description:
      "A quietly proportioned automatic in brushed steel and warm ivory.",
    stock: 12,
  },
  {
    name: "Aster 38",
    collection: "No. 02 / Hand-wound",
    category: "Dress",
    price: 980,
    image:
      "https://images.pexels.com/photos/277390/pexels-photo-277390.jpeg?auto=compress&cs=tinysrgb&w=1200",
    tone: "ink",
    description:
      "A slender silhouette with a midnight dial and hand-finished indices.",
    stock: 8,
  },
  {
    name: "Field Note",
    collection: "No. 03 / Mechanical",
    category: "Field",
    price: 745,
    image:
      "https://images.pexels.com/photos/1697214/pexels-photo-1697214.jpeg?auto=compress&cs=tinysrgb&w=1200",
    tone: "olive",
    description:
      "Built for the long way around, with a legible dial and canvas strap.",
    stock: 6,
  },
  {
    name: "The Deep 200",
    collection: "No. 04 / Diver",
    category: "Diver",
    price: 1680,
    image:
      "https://images.pexels.com/photos/364822/pexels-photo-364822.jpeg?auto=compress&cs=tinysrgb&w=1200",
    tone: "rust",
    description:
      "A disciplined tool watch with a ceramic bezel and 200m resistance.",
    stock: 10,
  },
  {
    name: "Civic Timer",
    collection: "No. 05 / Chronograph",
    category: "Chronograph",
    price: 1890,
    image:
      "https://images.pexels.com/photos/47856/rolex-watch-time-luxury-47856.jpeg?auto=compress&cs=tinysrgb&w=1200",
    tone: "sand",
    description:
      "A measured chronograph for days that deserve to be remembered.",
    stock: 3,
  },
  {
    name: "Solstice 34",
    collection: "No. 06 / Quartz",
    category: "Dress",
    price: 590,
    image:
      "https://images.pexels.com/photos/280250/pexels-photo-280250.jpeg?auto=compress&cs=tinysrgb&w=1200",
    tone: "blue",
    description: "A compact everyday companion with a sun-washed blue dial.",
    stock: 5,
  },
];

async function main() {
  await db.transaction(async (tx) => {
    await tx.delete(amalProducts);
    await tx.insert(amalProducts).values(
      products.map((p) => ({ ...p, price: p.price })),
    );
  });
  console.log(`Seeded ${products.length} products into amal_products`);
}

main()
  .then(() => pool.end())
  .catch((err) => {
    console.error(err);
    pool.end();
    process.exit(1);
  });