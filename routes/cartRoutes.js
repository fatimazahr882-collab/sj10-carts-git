const router = require('express').Router();
const controller = require('../controllers/cartController');
const auth = require('../middleware/authenticateUser');

router.use(auth);
router.get('/', controller.getCart);
router.post('/', controller.addItemToCart);
router.delete('/:cartItemId', controller.removeItemFromCart);

module.exports = router;