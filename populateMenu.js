const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { Restaurant, MenuItem, User } = require('../models/Restaurant');

mongoose.connect('mongodb://localhost:27017/jalsa_new', { useNewUrlParser: true, useUnifiedTopology: true });

const menuItems = [
    // Breakfast/Light Meals
    { name: 'Idli', description: 'Steamed rice cakes served with sambar and coconut chutney.', price: 40, category: 'Breakfast/Light Meals' },
    { name: 'Dosa', description: 'Crispy fermented rice and lentil crepes.', price: 60, category: 'Breakfast/Light Meals' },
    { name: 'Masala Dosa', description: 'Dosa filled with spiced potato mixture.', price: 70, category: 'Breakfast/Light Meals' },
    { name: 'Plain Dosa', description: 'Simple crispy dosa served with chutney and sambar.', price: 50, category: 'Breakfast/Light Meals' },
    { name: 'Vada', description: 'Deep-fried lentil doughnuts served with sambar and chutney.', price: 30, category: 'Breakfast/Light Meals' },
    { name: 'Upma', description: 'Semolina cooked with vegetables and spices.', price: 50, category: 'Breakfast/Light Meals' },
    { name: 'Pongal', description: 'Rice and lentil dish flavored with peppercorns and ghee.', price: 60, category: 'Breakfast/Light Meals' },
    { name: 'Appam', description: 'Soft and fluffy fermented rice pancakes served with stew or coconut milk.', price: 60, category: 'Breakfast/Light Meals' },
    { name: 'Uttapam', description: 'Thick pancake with toppings like onions, tomatoes, and chilies.', price: 80, category: 'Breakfast/Light Meals' },

    // Main Course
    { name: 'Sambar', description: 'A lentil-based vegetable stew with tamarind, served with rice or dosa.', price: 50, category: 'Main Course' },
    { name: 'Rasam', description: 'A spiced tamarind soup with tomatoes, typically eaten with rice.', price: 40, category: 'Main Course' },
    { name: 'Curd Rice', description: 'Rice mixed with yogurt and tempered with mustard seeds, curry leaves, and chilies.', price: 60, category: 'Main Course' },
    { name: 'Puliyodarai', description: 'Rice mixed with tamarind, peanuts, and spices.', price: 70, category: 'Main Course' },
    { name: 'Bisi Bele Bath', description: 'Spicy lentil and rice dish from Karnataka.', price: 80, category: 'Main Course' },
    { name: 'Chicken Chettinad', description: 'Spicy chicken curry made with a blend of spices from Tamil Nadu.', price: 180, category: 'Main Course' },
    { name: 'Mutton Sukka', description: 'Dry mutton dish with spices and coconut.', price: 220, category: 'Main Course' },
    { name: 'Kottu Parotta', description: 'Chopped flatbread mixed with vegetables and/or meat and spiced gravies.', price: 100, category: 'Main Course' },

    // Accompaniments
    { name: 'Coconut Chutney', description: 'Fresh coconut ground with green chilies and spices.', price: 20, category: 'Accompaniments' },
    { name: 'Tomato Chutney', description: 'Tangy and spicy chutney made with tomatoes.', price: 20, category: 'Accompaniments' }
];

const defaultRestaurant = {
    name: "Our Restaurant",
    description: "Welcome to our cozy restaurant!",
    cuisine: "International",
    openingHours: "Mon-Sat: 11am-10pm, Sun: 12pm-9pm",
    address: "123 Main St, Anytown, USA",
    phoneNumber: "(555) 123-4567",
    imageUrl: "/images/restaurant.jpg"
};

async function createDefaultRestaurant() {
    try {
        const existingRestaurant = await Restaurant.findOne();
        if (!existingRestaurant) {
            const newRestaurant = new Restaurant(defaultRestaurant);
            await newRestaurant.save();
            console.log('Default restaurant created successfully');
        } else {
            console.log('Restaurant already exists');
        }
    } catch (error) {
        console.error('Error creating default restaurant:', error);
    }
}

async function createAdminUser() {
    try {
        const existingAdmin = await User.findOne({ email: 'admin@example.com' });
        if (!existingAdmin) {
            const hashedPassword = await bcrypt.hash('adminpassword', 10);
            const adminUser = new User({
                username: 'admin',
                email: 'admin@example.com',
                password: hashedPassword,
                isAdmin: true
            });
            await adminUser.save();
            console.log('Admin user created successfully');
        } else {
            console.log('Admin user already exists');
        }
    } catch (error) {
        console.error('Error creating admin user:', error);
    }
}

async function populateDatabase() {
    try {
        await MenuItem.deleteMany({}); // Clear existing items
        await MenuItem.insertMany(menuItems);
        console.log('Menu items have been added to the database');

        await createAdminUser();
        await createDefaultRestaurant();
    } catch (error) {
        console.error('Error populating database:', error);
    } finally {
        mongoose.connection.close();
    }
}

populateDatabase();