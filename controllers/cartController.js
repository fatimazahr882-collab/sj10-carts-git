const db = require('../config/database');
const { clients } = require('../config/tursoConnection');

// Helper to fetch product details (Image/Price/Title) based on IDs in the cart
const fetchProductsFromTurso = async (productIds) => {
    if (!productIds || productIds.length === 0) return [];
    const uniqueIds = [...new Set(productIds)];
    const promises = Object.values(clients).map(async (client) => {
        try {
            const placeholders = uniqueIds.map(() => '?').join(',');
            const res = await client.execute({
                sql: `SELECT id, title, price, discounted_price, image_urls, supplier_id FROM products WHERE id IN (${placeholders})`,
                args: uniqueIds
            });
            return res.rows;
        } catch (e) { return []; }
    });
    return (await Promise.all(promises)).flat();
};

exports.getCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const [cartItems] = await db.carts.query("SELECT * FROM cart WHERE user_id = ? ORDER BY created_at DESC", [userId]);
        if (cartItems.length === 0) return res.status(200).json([]);

        const productIds = cartItems.map(item => item.product_id);
        const products = await fetchProductsFromTurso(productIds);
        const productMap = new Map(products.map(p => [p.id, p]));

        const processedCart = cartItems.map(item => {
            const product = productMap.get(item.product_id);
            let parsedOptions = {};
            try { if (item.options && typeof item.options === 'string') parsedOptions = JSON.parse(item.options); } catch (e) {}

            let imageUrls = [];
            try { 
                if (product?.image_urls) imageUrls = typeof product.image_urls === 'string' ? JSON.parse(product.image_urls) : product.image_urls; 
            } catch (e) {}

            const unitPrice = parseFloat(product?.discounted_price || product?.price || 0);

            return {
                cart_item_id: item.id,
                quantity: item.quantity,
                product_id: item.product_id,
                title: product?.title || 'Product Not Available',
                price: unitPrice,
                profit: parseFloat(item.profit) || 0,
                image_urls: imageUrls,
                options: parsedOptions,
            };
        });
        res.status(200).json(processedCart);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch cart." });
    }
};

exports.addItemToCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId, quantity } = req.body;
        if (!productId || !quantity) return res.status(400).json({ message: "Required fields missing" });
        
        let userProfit = parseFloat(req.body.profit) || 0;
        let cleanOptions = { ...(req.body.options || {}) };
        if (cleanOptions.profit) delete cleanOptions.profit; // Clean up options
        
        const parsedQuantity = parseInt(quantity);
        const optionsString = JSON.stringify(cleanOptions);

        const [existingItems] = await db.carts.query(
            "SELECT * FROM cart WHERE user_id = ? AND product_id = ? AND options = ?", 
            [userId, productId, optionsString]
        );

        if (existingItems.length > 0) {
            const item = existingItems[0];
            await db.carts.execute("UPDATE cart SET quantity = ?, profit = ? WHERE id = ?", [item.quantity + parsedQuantity, userProfit, item.id]);
        } else {
            await db.carts.execute(
                "INSERT INTO cart (user_id, product_id, quantity, options, profit) VALUES (?, ?, ?, ?, ?)", 
                [userId, productId, parsedQuantity, optionsString, userProfit]
            );
        }
        res.status(200).json({ message: "Added to cart" });
    } catch (error) {
        res.status(500).json({ message: "Failed to add" });
    }
};

exports.removeItemFromCart = async (req, res) => {
    try {
        await db.carts.execute("DELETE FROM cart WHERE id = ? AND user_id = ?", [req.params.cartItemId, req.user.id]);
        res.status(200).json({ message: "Removed" });
    } catch (error) {
        res.status(500).json({ message: "Failed" });
    }
};