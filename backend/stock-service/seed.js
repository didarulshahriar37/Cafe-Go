const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

const items = [
    {
        title: "Iftar Platter Standard",
        description: "The complete Deshi experience: Chola, Piyaju, Beguni, Alur Chop, Muri, and two Dates. Perfect for one.",
        price: 9.99,
        stock: 50,
        category: "Iftar Special",
        image: "https://images.unsplash.com/photo-1590520603700-1616499a093a?auto=format&fit=crop&q=80&w=800"
    },
    {
        title: "Shahi Mutton Halim",
        description: "Slow-cooked rich stew of lentils, wheat, and tender mutton, garnished with ginger, lemon, and fried onions.",
        price: 15.99,
        stock: 40,
        category: "Iftar Special",
        image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=800"
    },
    {
        title: "Crispy Beguni (4pcs)",
        description: "Traditional eggplant fritters, extra crispy and seasoned with special chat masala.",
        price: 2.50,
        stock: 120,
        category: "Traditional",
        image: "https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&q=80&w=800"
    },
    {
        title: "Bengali Piyaju (4pcs)",
        description: "Savory lentil fritters with onions and green chilies. The soul of Iftar.",
        price: 2.50,
        stock: 120,
        category: "Traditional",
        image: "https://images.unsplash.com/photo-1591124622031-6e3e5c0de971?auto=format&fit=crop&q=80&w=800"
    },
    {
        title: "Masala Chola Boot",
        description: "Bengali style spiced chickpeas sautéed with onions, green chilies, and coriander.",
        price: 3.99,
        stock: 150,
        category: "Traditional",
        image: "https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&q=80&w=800"
    },
    {
        title: "Shahi Borhani",
        description: "Traditional yogurt based savory drink blended with mustard seeds, mint, and black salt.",
        price: 3.50,
        stock: 60,
        category: "Drinks",
        image: "https://images.unsplash.com/photo-1571006682868-a2d3ff17c095?auto=format&fit=crop&q=80&w=800"
    },
    {
        title: "Saffron Jalebi",
        description: "Golden swirls of happiness, soaked in saffron sugar syrup.",
        price: 5.50,
        stock: 80,
        category: "Dessert",
        image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=800"
    },
    {
        title: "Signature Rooh Afza",
        description: "Refreshing pink rose syrup with basil seeds and chilled water.",
        price: 1.99,
        stock: 200,
        category: "Drinks",
        image: "https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?auto=format&fit=crop&q=80&w=800"
    },
    {
        title: "Apple & Guava Bowl",
        description: "Freshly cut green apples and ripe guavas seasoned with black salt and chili flakes.",
        price: 4.50,
        stock: 35,
        category: "Healthy",
        image: "https://images.unsplash.com/photo-1519996529931-28324d5a630e?auto=format&fit=crop&q=80&w=800"
    },
    {
        title: "Premium Medjool Dates",
        description: "Six large, sweet, and meaty dates from the Middle East.",
        price: 6.99,
        stock: 100,
        category: "Traditional",
        image: "https://images.unsplash.com/photo-1590520603700-1616499a093a?auto=format&fit=crop&q=80&w=800"
    }
];

async function seed() {
    try {
        await client.connect();
        const db = client.db('cafe_inventory');
        const collection = db.collection('inventory');

        await collection.deleteMany({});
        await collection.insertMany(items);

        console.log("✅ Database seeded with a massive Deshi Iftari collection!");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seed();
