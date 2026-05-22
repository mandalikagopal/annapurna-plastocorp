import { db } from './firebase'; // Ensure this points to your firebase config file
import { collection, addDoc, getDocs, deleteDoc, writeBatch } from 'firebase/firestore';
import toast from 'react-hot-toast';

const allProducts = [
  // PLATES
  {
    name: "Green/Multicolour/White Plates",
    category: "Plates",
    description: "Standard high-quality disposable plates for catering and events. Available in multiple colors.",
    imageUrl: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?q=80&w=500",
    variants: [
      { size: '8"', price: 100 }, { size: '10"', price: 120 },
      { size: '12"', price: 150 }, { size: '14"', price: 180 }
    ]
  },
  {
    name: "Bakery Plates",
    category: "Plates",
    description: "Lightweight plates specifically designed for bakery items, cakes, and snacks.",
    imageUrl: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?q=80&w=500",
    variants: [{ size: '7"', price: 80 }, { size: '8"', price: 90 }, { size: '10"', price: 110 }]
  },
  {
    name: "Biodegradable Plates",
    category: "Plates",
    description: "Eco-friendly plates made from compostable materials. Sturdy and sustainable.",
    imageUrl: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?q=80&w=500",
    variants: [
      { size: '7"', price: 130 }, { size: '8"', price: 150 },
      { size: '9"', price: 170 }, { size: '12"', price: 210 }
    ]
  },
  {
    name: "Leafy Plates",
    category: "Plates",
    description: "Natural leaf-based plates (Areca/Dona) for a premium eco-friendly dining experience.",
    imageUrl: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?q=80&w=500",
    variants: [{ size: '12"', price: 220 }, { size: '14"', price: 280 }]
  },

  // CUPS & GLASSES
  {
    name: "Tea Cups",
    category: "Cups",
    description: "Disposable tea/coffee cups designed for hot beverages. Heat resistant.",
    imageUrl: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?q=80&w=500",
    variants: [
      { size: "65ml", price: 40 }, { size: "75ml", price: 50 },
      { size: "85ml", price: 60 }, { size: "110ml", price: 80 }
    ]
  },
  {
    name: "Ice Cream Cups",
    category: "Cups",
    description: "Wide-mouth cups perfect for frozen desserts and ice creams.",
    imageUrl: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?q=80&w=500",
    variants: [{ size: "Small", price: 35 }, { size: "Big", price: 65 }]
  },
  {
    name: "Water/Plastic Cups",
    category: "Cups",
    description: "Clear or white plastic cups for water and cold beverages.",
    imageUrl: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?q=80&w=500",
    variants: [{ size: "Medium", price: 45 }, { size: "Thick", price: 75 }]
  },
  {
    name: "Juice Glasses",
    category: "Cups",
    description: "Tall disposable glasses for juices, shakes, and mocktails.",
    imageUrl: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?q=80&w=500",
    variants: [
      { size: "210ml", price: 90 }, { size: "250ml", price: 110 }, { size: "300ml", price: 140 }
    ]
  },

  // CARRY BAGS
  {
    name: "Transparent/Starmake Bags",
    category: "Carry Bags",
    description: "Heavy-duty transparent carry bags for general retail and grocery use.",
    imageUrl: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?q=80&w=500",
    variants: [
      { size: "10x12", price: 200 }, { size: "11x14", price: 240 },
      { size: "13x16", price: 280 }, { size: "16x20", price: 350 }
    ]
  },
  {
    name: "Milky White Bags",
    category: "Carry Bags",
    description: "Premium milky white carry bags for specialized packaging.",
    imageUrl: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?q=80&w=500",
    variants: [
      { size: "17x23", price: 320 }, { size: "20x26", price: 400 }
    ]
  },

  // CONTAINERS
  {
    name: "Railway Containers",
    category: "Containers",
    description: "Rectangular food-grade containers, ideal for meal delivery and takeaways.",
    imageUrl: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?q=80&w=500",
    variants: [
      { size: "250ml", price: 100 }, { size: "450ml", price: 140 }, { size: "750ml", price: 180 }
    ]
  },
  {
    name: "Plastic Round Containers",
    category: "Containers",
    description: "General purpose round plastic food containers with secure lids.",
    imageUrl: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?q=80&w=500",
    variants: [
      { size: "100ml", price: 50 }, { size: "150ml", price: 65 },
      { size: "250ml", price: 80 }, { size: "400ml", price: 110 },
      { size: "500ml", price: 130 }, { size: "750ml", price: 160 },
      { size: "1000ml", price: 210 }
    ]
  },

  // TISSUES, POUCHES, SPOONS
  {
    name: "Face Tissues",
    category: "Tissues",
    description: "Soft and absorbent paper tissues for hospitality and home use.",
    imageUrl: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?q=80&w=500",
    variants: [{ size: "Small", price: 40 }, { size: "Big", price: 70 }]
  },
  {
    name: "Silver Pouches",
    category: "Pouches",
    description: "Laminated silver pouches for snack packaging and heat retention.",
    imageUrl: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?q=80&w=500",
    variants: [
      { size: "4x6", price: 50 }, { size: "5x7", price: 70 },
      { size: "6x8", price: 90 }, { size: "7x9", price: 110 },
      { size: "8x10", price: 140 }, { size: "9x12", price: 180 }
    ]
  },
  {
    name: "Poly Pouches",
    category: "Pouches",
    description: "Transparent poly pouches for general items.",
    imageUrl: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?q=80&w=500",
    variants: [
      { size: "5x6", price: 30 }, { size: "5x8", price: 45 }, { size: "6x9", price: 60 }
    ]
  },
  {
    name: "Disposable Cutlery",
    category: "Spoons",
    description: "Variety of plastic and wooden spoons and forks.",
    imageUrl: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?q=80&w=500",
    variants: [
      { size: "Plastic Thin", price: 20 }, { size: "Plastic Thick", price: 40 },
      { size: "Wooden Medium", price: 60 }, { size: "Pink Small", price: 30 }
    ]
  }
];

export const bulkUploadProducts = async () => {
  const productCol = collection(db, 'products');
  
  try {
    console.log("🛠️ Starting database setup...");

    // 1. Clear existing products to avoid duplicates
    const snapshot = await getDocs(productCol);
    if (!snapshot.empty) {
      console.log("🧹 Found existing products. Cleaning up...");
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log("✅ Old product data cleared.");
    }

    // 2. Upload the new list
    console.log("📤 Uploading fresh product list...");
    for (const product of allProducts) {
      await addDoc(productCol, product);
      console.log(`✅ Uploaded: ${product.name}`);
    }
    toast.success(`Annapurna Plastocorp database is successfully synced!`, {
          style: {
            borderRadius: '12px',
            background: '#1e293b',
            color: '#fff',
          },
        });    
    return true;
  } catch (error) {
    console.error("❌ Setup failed:", error);
    toast.error(`Error uploading products. Check the console for details.`, {
          style: {
            borderRadius: '12px',
            background: '#1e293b',
            color: '#fff',
          },
        });  
    return false;
  }
};