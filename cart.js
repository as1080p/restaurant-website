document.addEventListener('DOMContentLoaded', () => {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    function updateCart() {
        localStorage.setItem('cart', JSON.stringify(cart));
        
        const cartItems = document.getElementById('cart-items');
        const cartTotal = document.getElementById('cart-total');
        
        if (cartItems && cartTotal) {
            cartItems.innerHTML = '';
            let total = 0;

            cart.forEach((item, index) => {
                const li = document.createElement('li');
                li.textContent = `${item.name} - ₹${item.price.toFixed(2)}`;
                const removeButton = document.createElement('button');
                removeButton.textContent = 'Remove';
                removeButton.onclick = () => removeFromCart(index);
                li.appendChild(removeButton);
                cartItems.appendChild(li);
                total += item.price;
            });

            cartTotal.textContent = total.toFixed(2);
        }
    }

    function addToCart(item, price, id) {
        cart.push({ name: item, price: parseFloat(price), _id: id, quantity: 1 });
        updateCart();
    }

    function removeFromCart(index) {
        cart.splice(index, 1);
        updateCart();
    }

    // Add to cart buttons
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', () => {
            const item = button.getAttribute('data-item');
            const price = parseFloat(button.getAttribute('data-price'));
            const id = button.getAttribute('data-id');
            addToCart(item, price, id);
        });
    });

    // Payment form submission
    const paymentForm = document.getElementById('payment-form');
    if (paymentForm) {
        paymentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(paymentForm);
            const paymentData = Object.fromEntries(formData.entries());
            const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;

            try {
                const response = await fetch('/api/process-payment', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        cart: cart.map(item => ({
                            _id: item._id,
                            name: item.name,
                            price: item.price,
                            quantity: item.quantity
                        })),
                        payment: {
                            method: paymentMethod,
                            ...paymentData
                        },
                        deliveryInfo: Object.fromEntries(new FormData(document.getElementById('delivery-form')).entries())
                    }),
                });

                if (response.ok) {
                    const result = await response.json();
                    let message = `Order placed successfully! Order ID: ${result.orderId}`;
                    if (result.deliveryBoy) {
                        message += `\nDelivery Boy: ${result.deliveryBoy.name}\nPhone: ${result.deliveryBoy.phone}`;
                    } else {
                        message += '\nNo delivery boy available at the moment. We will assign one soon.';
                    }
                    alert(message);
                    cart = [];
                    updateCart();
                    modal.style.display = 'none';
                } else {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Payment failed');
                }
            } catch (error) {
                alert('Payment failed: ' + error.message);
            }
        });
    }

    updateCart();
});