const express = require('express');
const router = express.Router();

const {signup, login, logout, forgotPassword, passwordReset, getLoggedInUserDetails, changePassword, updateUserDetails, adminAllUsers, managerAllUsers, adminGetSingleUser, adminUpdateSingleUser, adminDeleteSingleUser} = require('../controllers/userController');
const { isLoggedIn, customRole } = require('../middlewares/user');

router.route('/signup').post(signup);
router.route('/login').post(login);
router.route('/logout').get(logout);
router.route('/forgotpassword').post(forgotPassword);
router.route('/password/reset/:token').post(passwordReset);
router.route('/userdashboard').get(isLoggedIn, getLoggedInUserDetails);
router.route('/password/update').post(isLoggedIn, changePassword);
router.route('/userdashboard/update').post(isLoggedIn, updateUserDetails);

//admin routes
router.route('/admin/users').get(isLoggedIn, customRole('admin'), adminAllUsers);
router.route('/admin/user/:id')
.get(isLoggedIn, customRole('admin'), adminGetSingleUser)
.put(isLoggedIn, customRole('admin'), adminUpdateSingleUser)
.delete(isLoggedIn, customRole('admin'), adminDeleteSingleUser);

router.route('/manager/users').get(isLoggedIn, customRole('manager'), managerAllUsers);

module.exports = router;