const express = require('express');
const router = express.Router();

const { createOrder, getOneOrder, getLoggedInUserOrders, adminGetAllOrders, adminDeleteOneOrder, adminUpdateOrder } = require('../controllers/orderController');
const { isLoggedIn, customRole } = require('../middlewares/user');

//user routes
router.route('/order/create').post(isLoggedIn, createOrder);
router.route('/order/myorder').get(isLoggedIn, getLoggedInUserOrders);
router.route('/order/:id').get(isLoggedIn, getOneOrder);

router.route('/admin/orders').get(isLoggedIn, customRole('admin'), adminGetAllOrders);
router.route('/admin/order/:id')
    .put(isLoggedIn, customRole('admin'), adminUpdateOrder)
    .delete(isLoggedIn, customRole('admin'), adminDeleteOneOrder);

module.exports = router;