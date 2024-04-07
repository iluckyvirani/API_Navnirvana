import { Router } from "express";
const router = Router();

// import all controller 
 import * as controller from '../controllers/appController.js';
 import { getuser} from '../controllers/appController.js';
import  {updateUser} from '../controllers/appController.js';
import Auth, { localVariables } from '../middleware/auth.js';
// POST Methods
router.route('/register').post(controller.register);// register user
//router.route('/registerMail').post(); // send the email
router.route('/authenticate').post( (req,res)=>res.end()); // authenticate user
router.route('/login').post(controller.verifyUser, controller.login); // login in app


// GET Methods
router.route('/user/:name').get( getuser); //user with username 
router.route('/generatepasswordOTP').get( controller.verifyUser, localVariables,controller.generatepasswordOTP); // generate random OTP
router.route('/verifyOTP').get(controller.verifyUser,controller.verifyOTP); // verify generated OTP
// router.route('/createResetSession').get(controller.createResetSession); // reset all the variables


// PUT Methods
router.route('/updateuser').put(Auth,updateUser); // is use to update the user profile
router.route('/resetPassword').put(controller.verifyUser,controller.resetPassword); // use to reset password


export default router;