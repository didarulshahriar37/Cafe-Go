const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

const items = [
    {
        title: "Classic Beef Burger",
        description: "Juicy prime beef patty with melted cheddar, crisp lettuce, and our secret CafeGo signature sauce on a toasted brioche bun.",
        price: 12.50,
        stock: 50,
        category: "Iftar Special",
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800"
    },
    {
        title: "Iftar Date & Nut Plate",
        description: "A selection of premium Medjool dates stuffed with walnuts and almonds. The perfect way to break your fast.",
        price: 5.99,
        stock: 100,
        category: "Traditional",
        image: "https://images.unsplash.com/photo-1590520603700-1616499a093a?auto=format&fit=crop&q=80&w=800"
    },
    {
        title: "Mango Lassi",
        description: "Refreshingly sweet and creamy chilled mango smoothie with a hint of cardamom.",
        price: 4.50,
        stock: 30,
        category: "Drinks",
        image: "https://images.unsplash.com/photo-1571006682868-a2d3ff17c095?auto=format&fit=crop&q=80&w=800"
    },
    {
        title: "Golden Samosa Basket",
        description: "Crispy triangular pastries filled with spiced potatoes and peas. Served with mint chutney.",
        price: 7.25,
        stock: 15,
        category: "Sides",
        image: "https://images.unsplash.com/photo-1601050690597-df056fb1cdb1?auto=format&fit=crop&q=80&w=800"
    }
];

async function seed() {
    try {
        await client.connect();
        const db = client.db('cafe_inventory');
        const collection = db.collection('inventory');

        // Clear existing
        await collection.deleteMany({});

        // Insert new
        await collection.insertMany(items);

        console.log("✅ Database seeded with Ramadan menu items!");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seed();
