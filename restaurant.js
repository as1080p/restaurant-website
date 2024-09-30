const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const { Restaurant, MenuItem, User, Booking, Order, DeliveryBoy } = require('../models/Restaurant');

// Middleware to check if user is logged in
const isLoggedIn = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/login');
    }
};

// Default restaurant data
const defaultRestaurant = {
    name: "Our Restaurant",
    description: "Welcome to our cozy restaurant!",
    cuisine: "International",
    openingHours: "Mon-Sat: 11am-10pm, Sun: 12pm-9pm",
    address: "123 Main St, Anytown, USA",
    phoneNumber: "(555) 123-4567",
    imageUrl: "/images/restaurant.jpg"
};

// Home route
router.get('/', async (req, res) => {
    try {
        let restaurant = await Restaurant.findOne();
        if (!restaurant) {
            restaurant = defaultRestaurant;
        }
        res.render('index', { restaurant });
    } catch (error) {
        console.error("Error fetching restaurant data:", error);
        res.render('index', { restaurant: defaultRestaurant });
    }
});

// Menu route
router.get('/menu', isLoggedIn, async (req, res) => {
    try {
        const menuItems = await MenuItem.find().sort('category');
        res.render('menu', { title: 'Our Menu', menuItems });
    } catch (error) {
        console.error("Error fetching menu items:", error);
        res.render('menu', { title: 'Our Menu', menuItems: [] });
    }
});

// Contact route
router.get('/contact', async (req, res) => {
    try {
        let restaurant = await Restaurant.findOne();
        if (!restaurant) {
            restaurant = defaultRestaurant;
        }
        res.render('contact', { restaurant });
    } catch (error) {
        console.error("Error fetching restaurant data:", error);
        res.render('contact', { restaurant: defaultRestaurant });
    }
});

// Signup route
router.get('/signup', (req, res) => {
    res.render('signup');
});

router.post('/signup', async (req, res) => {
    try {
        const user = new User(req.body);
        await user.save();
        res.redirect('/login');
    } catch (error) {
        res.status(400).render('signup', { error: 'Username or email already exists' });
    }
});

// Login route
router.get('/login', (req, res) => {
    res.render('login');
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        
        if (user && await bcrypt.compare(password, user.password)) {
            req.session.userId = user._id;
            req.session.isAdmin = user.isAdmin || false; // Set isAdmin based on user data
            res.redirect(user.isAdmin ? '/admin' : '/menu');
        } else {
            res.status(400).render('login', { error: 'Invalid email or password' });
        }
    } catch (error) {
        console.error("Login error:", error);
        res.status(400).render('login', { error: 'An error occurred during login' });
    }
});

// Logout route
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.redirect('/');
        }
        res.clearCookie('connect.sid');
        res.redirect('/');
    });
});

// Booking route
router.get('/book', isLoggedIn, (req, res) => {
    res.render('booking');
});

router.post('/book', isLoggedIn, async (req, res) => {
    try {
        const { date, time, guests } = req.body;
        const booking = new Booking({
            user: req.session.userId,
            date,
            time,
            guests
        });
        await booking.save();
        res.redirect('/bookings');
    } catch (error) {
        console.error("Error creating booking:", error);
        res.status(400).render('booking', { error: 'Unable to create booking. Please try again.' });
    }
});

// View bookings route
router.get('/bookings', isLoggedIn, async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.session.userId }).sort('date');
        res.render('bookings', { bookings });
    } catch (error) {
        console.error("Error fetching bookings:", error);
        res.status(400).render('bookings', { error: 'Unable to fetch bookings. Please try again.' });
    }
});

// Cart route
router.get('/cart', isLoggedIn, (req, res) => {
    res.render('cart');
});

// Mock payment processing API
router.post('/api/process-payment', isLoggedIn, async (req, res) => {
    try {
        const { cart, payment, deliveryInfo } = req.body;
        
        if (!cart || !Array.isArray(cart) || cart.length === 0) {
            throw new Error('Invalid or empty cart data');
        }
        
        // Create a new order
        const orderItems = cart.map(item => ({
            menuItem: item._id,
            quantity: item.quantity || 1,
            price: item.price
        }));

        const total = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);

        // Assign a random delivery boy
        const deliveryBoys = await DeliveryBoy.find({ status: 'Available' });
        let assignedDeliveryBoy = null;
        if (deliveryBoys.length > 0) {
            const randomIndex = Math.floor(Math.random() * deliveryBoys.length);
            assignedDeliveryBoy = deliveryBoys[randomIndex];
            assignedDeliveryBoy.status = 'Assigned';
            await assignedDeliveryBoy.save();
        }

        const newOrder = new Order({
            user: req.session.userId,
            items: orderItems,
            total: total,
            status: 'pending',
            deliveryBoy: assignedDeliveryBoy ? assignedDeliveryBoy._id : null
        });

        await newOrder.save();

        res.json({ 
            success: true, 
            orderId: newOrder._id,
            deliveryBoy: assignedDeliveryBoy ? {
                name: assignedDeliveryBoy.name,
                phone: assignedDeliveryBoy.phone
            } : null
        });
    } catch (error) {
        console.error("Error processing payment:", error);
        res.status(500).json({ success: false, error: 'Payment processing failed: ' + error.message });
    }
});

// Admin routes
router.get('/admin', (req, res) => {
    if (req.session.isAdmin) {
        res.render('admin/dashboard');
    } else {
        res.redirect('/login');
    }
});

router.get('/admin/menu', async (req, res) => {
    const menuItems = await MenuItem.find().sort('category');
    res.render('admin/menu', { menuItems });
});

router.get('/admin/bookings', async (req, res) => {
    const bookings = await Booking.find().populate('user', 'username').sort('date');
    res.render('admin/bookings', { bookings });
});

router.get('/admin/orders', async (req, res) => {
    // Assuming you have an Order model
    const orders = await Order.find().populate('user', 'username').sort('-createdAt');
    res.render('admin/orders', { orders });
});

// Admin menu management
router.post('/admin/menu/add', async (req, res) => {
    try {
        const newItem = new MenuItem(req.body);
        await newItem.save();
        res.redirect('/admin/menu');
    } catch (error) {
        console.error("Error adding menu item:", error);
        res.status(500).send("Error adding menu item");
    }
});

router.post('/admin/menu/edit/:id', async (req, res) => {
    try {
        await MenuItem.findByIdAndUpdate(req.params.id, req.body);
        res.redirect('/admin/menu');
    } catch (error) {
        console.error("Error updating menu item:", error);
        res.status(500).send("Error updating menu item");
    }
});

router.post('/admin/menu/delete/:id', async (req, res) => {
    try {
        await MenuItem.findByIdAndDelete(req.params.id);
        res.redirect('/admin/menu');
    } catch (error) {
        console.error("Error deleting menu item:", error);
        res.status(500).send("Error deleting menu item");
    }
});

// Admin booking management
router.post('/admin/bookings/update/:id', async (req, res) => {
    try {
        await Booking.findByIdAndUpdate(req.params.id, { status: req.body.status });
        res.redirect('/admin/bookings');
    } catch (error) {
        console.error("Error updating booking:", error);
        res.status(500).send("Error updating booking");
    }
});

// Generate OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Store OTPs (in memory for simplicity, use a database in production)
const otps = new Map();

// Management page route
router.get('/anagha', (req, res) => {
    res.render('management-login');
});

router.post('/anagha/send-otp', async (req, res) => {
    const { email } = req.body;
    const otp = generateOTP();
    otps.set(email, otp);

    // For testing, log the OTP to console instead of sending an email
    console.log(`OTP for ${email}: ${otp}`);

    res.json({ success: true, message: 'OTP sent successfully (check server console)' });
});

router.post('/anagha/verify-otp', async (req, res) => {
    const { email, otp } = req.body;
    if (otps.get(email) === otp) {
        otps.delete(email);
        req.session.managementAccess = true;
        res.json({ success: true });
    } else {
        res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
});

// Middleware to check management access
const checkManagementAccess = (req, res, next) => {
    if (req.session.managementAccess) {
        next();
    } else {
        res.redirect('/anagha');
    }
};

// Update the existing /anagha route to use the new middleware
router.get('/anagha/dashboard', checkManagementAccess, async (req, res) => {
    try {
        const menuItems = await MenuItem.find().sort('category');
        const bookings = await Booking.find().populate('user', 'username').sort('date');
        const deliveryBoys = await DeliveryBoy.find() || [];
        res.render('anagha', { menuItems, bookings, deliveryBoys });
    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).send("Error fetching data");
    }
});

// New routes for table booking and delivery boy management
router.post('/anagha/booking/update/:id', async (req, res) => {
    try {
        await Booking.findByIdAndUpdate(req.params.id, req.body);
        res.redirect('/anagha');
    } catch (error) {
        console.error("Error updating booking:", error);
        res.status(500).send("Error updating booking");
    }
});

router.post('/anagha/deliveryboy/add', async (req, res) => {
    try {
        const newDeliveryBoy = new DeliveryBoy(req.body);
        await newDeliveryBoy.save();
        res.redirect('/anagha');
    } catch (error) {
        console.error("Error adding delivery boy:", error);
        res.status(500).send("Error adding delivery boy");
    }
});

router.post('/anagha/deliveryboy/update/:id', async (req, res) => {
    try {
        await DeliveryBoy.findByIdAndUpdate(req.params.id, req.body);
        res.redirect('/anagha');
    } catch (error) {
        console.error("Error updating delivery boy:", error);
        res.status(500).send("Error updating delivery boy");
    }
});

// Anagha's menu edit page
router.get('/anagha', async (req, res) => {
    try {
        const menuItems = await MenuItem.find().sort('category');
        res.render('anagha', { menuItems });
    } catch (error) {
        console.error("Error fetching menu items:", error);
        res.status(500).send("Error fetching menu items");
    }
});

router.post('/anagha/edit/:id', async (req, res) => {
    try {
        const { name, description, price, category } = req.body;
        await MenuItem.findByIdAndUpdate(req.params.id, { name, description, price, category });
        res.redirect('/anagha');
    } catch (error) {
        console.error("Error updating menu item:", error);
        res.status(500).send("Error updating menu item");
    }
});

router.post('/anagha/delete/:id', async (req, res) => {
    try {
        await MenuItem.findByIdAndDelete(req.params.id);
        res.redirect('/anagha');
    } catch (error) {
        console.error("Error deleting menu item:", error);
        res.status(500).send("Error deleting menu item");
    }
});

router.post('/anagha/add', async (req, res) => {
    try {
        const newItem = new MenuItem(req.body);
        await newItem.save();
        res.redirect('/anagha');
    } catch (error) {
        console.error("Error adding menu item:", error);
        res.status(500).send("Error adding menu item");
    }
});

module.exports = router;