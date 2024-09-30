const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const menuItemSchema = new mongoose.Schema({
    name: String,
    description: String,
    price: Number,
    category: String
});

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false }
});

userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 8);
    }
    next();
});

const bookingSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    guests: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' }
});

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{ 
        menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
        quantity: Number,
        price: Number
    }],
    total: Number,
    status: { type: String, enum: ['pending', 'processing', 'completed', 'cancelled'], default: 'pending' },
    createdAt: { type: Date, default: Date.now },
    deliveryBoy: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryBoy' }
});

const restaurantSchema = new mongoose.Schema({
    name: String,
    description: String,
    cuisine: String,
    openingHours: String,
    address: String,
    phoneNumber: String,
    imageUrl: String
});

const deliveryBoySchema = new mongoose.Schema({
    name: String,
    phone: String,
    status: { type: String, default: 'Available' }
});

const Restaurant = mongoose.model('Restaurant', restaurantSchema);
const MenuItem = mongoose.model('MenuItem', menuItemSchema);
const User = mongoose.model('User', userSchema);
const Booking = mongoose.model('Booking', bookingSchema);
const Order = mongoose.model('Order', orderSchema);
const DeliveryBoy = mongoose.model('DeliveryBoy', deliveryBoySchema);

module.exports = { Restaurant, MenuItem, User, Booking, Order, DeliveryBoy };