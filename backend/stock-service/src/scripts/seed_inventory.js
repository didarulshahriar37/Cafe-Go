require('dotenv').config();
const { getDB } = require('../db/mongo');
const { ObjectId } = require('mongodb');

async function seedInventory() {
    try {
        const db = await getDB();
        const collection = db.collection('inventory');

        const items = [
            {
                title: 'Traditional Haleem',
                price: 120,
                stock: 45,
                version: 1,
                category: 'Iftar Special',
                description: 'Rich, slow-cooked stew of lentils, meat, and spices. A Ramadan essential.',
                image: 'https://images.unsplash.com/photo-1614332287897-cdc485fa562d?auto=format&fit=crop&q=80&w=800'
            },
            {
                title: 'Premium Jalebi',
                price: 80,
                stock: 60,
                version: 1,
                category: 'Sweets',
                description: 'Crispy, syrupy swirls of golden perfection. Best served hot.',
                image: 'https://images.unsplash.com/photo-1626132646549-9504af1544eb?auto=format&fit=crop&q=80&w=800'
            },
            {
                title: 'Crispy Beguni',
                price: 30,
                stock: 100,
                version: 1,
                category: 'Fried',
                description: 'Deep-fried eggplant slices in a spicy gram flour batter.',
                image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&q=80&w=800'
            },
            {
                title: 'Classic Alloo Chop',
                price: 25,
                stock: 85,
                version: 1,
                category: 'Fried',
                description: 'Savory mashed potato patties with aromatic spices.',
                image: 'https://images.unsplash.com/photo-1589676773108-20fbd503c4c1?auto=format&fit=crop&q=80&w=800'
            },
            {
                title: 'Beef Tehari',
                price: 150,
                stock: 30,
                version: 1,
                category: 'Main Course',
                description: 'Fragrant mustard-oil rice cooked with tender beef chunks.',
                image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&q=80&w=800'
            },
            {
                title: 'Aromatic Shahi Tukda',
                price: 90,
                stock: 25,
                version: 1,
                category: 'Dessert',
                description: 'Royal bread pudding with saffron, nuts, and thick cream.',
                image: 'https://images.unsplash.com/photo-1563729784404-d73139361664?auto=format&fit=crop&q=80&w=800'
            },
            {
                title: 'Fresh Dates Box',
                price: 50,
                stock: 200,
                version: 1,
                category: 'Essential',
                description: 'Premium organic dates to break your fast with grace.',
                image: 'https://images.unsplash.com/photo-1597022513941-6e8eb8903c62?auto=format&fit=crop&q=80&w=800'
            }
        ];

        console.log('Cleaning existing inventory...');
        await collection.deleteMany({});

        console.log('Seeding new Iftar items...');
        await collection.insertMany(items);

        console.log('✅ Inventory seeded successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
}

seedInventory();
