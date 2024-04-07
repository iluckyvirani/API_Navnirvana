import userModel from "../model/user.model.js";
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken";
import ENV from '../config.js';
import otpGenerator from 'otp-generator';
import crypto from 'crypto';

/** middleware for verify user */
export async function verifyUser(req, res, next) {
    try {

        const { phone } = req.method == "GET" ? req.query : req.body;

        // check the user existance
        let exist = await userModel.findOne({ phone });
        if (!exist) return res.status(404).send({ error: "Can't find User!" });
        next();

    } catch (error) {
        return res.status(404).send({ error: "Authentication Error" });
    }
}


/** POST :http://localhost:5000/api/register
//  * @param {
//  * "name":"shivangi",
//  * "phone":"9450490471",
//  * "email":"shiv123@gmail.com",
//  * "password":"shi1234"
//  * 
//  * 
//  * } 
 
 */


export async function register(req, res) {
    try {
        const { name, phone, email, password } = req.body;

        // Check for existing user
        const existingUser = await userModel.findOne({ phone });
        if (existingUser) {
            return res.status(400).json({ error: "Please use a different phone." });
        }

        // Check for existing email
        const existingEmail = await userModel.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ error: "Please use a different email address." });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate random OTP
        const otp = generateOTP();

        // Create new user with OTP
        const newUser = new userModel({
            name,
            email,
            phone,
            password: hashedPassword,
            otp // Save the OTP along with user data
        });

        // Save user to database
        await newUser.save();

        return res.status(201).json({ message: "User registered successfully.", otp });
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
}

// Function to generate random 6-digit OTP
function generateOTP() {
    const otp = Math.floor(100000 + Math.random() * 900000); // Generate a random number between 100000 and 999999
    return otp.toString(); // Convert the number to string to ensure it's exactly 6 digits
}

/** POST :http://localhost:5000/api/login
//  * @param {
    //  * "phone":"9450490471"
    //  * "password":"shi1234"
  
    //  * } 
     
     */

    export async function login(req, res) {
        const { phone, password } = req.body;
    
        try {
            userModel.findOne({ phone })
                .then(user => {
                    if (!user) {
                        return res.status(404).send({ error: "Phone number not found" });
                    }
    
                    bcrypt.compare(password, user.password)
                        .then(passwordCheck => {
                            if (!passwordCheck) {
                                return res.status(400).send({ error: "Incorrect password" });
                            }
    
                            // Generate JWT token
                            const token = jwt.sign({
                                userId: user._id,
                                phone: user.phone
                            }, ENV.JWT_SECRET, { expiresIn: "24h" });
    
                            // Generate OTP
                            const otp = otpGenerator.generate(6, { upperCase: false, specialChars: false });
    
                            // TODO: Send OTP to the user via SMS or email
    
                            return res.status(200).send({
                                msg: "Login successful.",
                                phone: user.phone,
                                otp,
                                token // Include the JWT token in the response
                            });
                        })
                        .catch(error => {
                            console.error("Error:", error);
                            return res.status(500).send({ error: "Internal server error" });
                        });
                })
                .catch(error => {
                    console.error("Error:", error);
                    return res.status(500).send({ error: "Internal server error" });
                });
        } catch (error) {
            console.error("Error:", error);
            return res.status(500).send({ error: "Internal server error" });
        }
    }
/** GET :http://localhost:5000/api/user/name
//  * @param {
    //  * "name":"shivangi",
    //  * "phone":"9450490471",
    //  * "email":"shiv123@gmail.com",
    //  * "password":"shi1234"
    //  * 
    //  * 
    //  * } 
     
     */
export async function getuser(req, res) {
    const { name } = req.params;

    try {
        if (!name) {
            return res.status(400).send({ error: "Invalid name parameter" });
        }

        const user = await userModel.findOne({ name });

        if (!user) {
            return res.status(404).send({ error: "User not found" });
        }

        /** remove password from user */
        // mongoose return unnecessary data with object so convert it into json
        const { password, ...rest } = Object.assign({}, user.toJSON());

        return res.status(200).send(user);
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).send({ error: "Internal server error" });
    }
}



/** PUT :http://localhost:5000/api/user/updateuser
//  * @param {
//  "id":"<userid>"

//  * } 
body:{
    "name":"",
    "phone":"",
    "email":"",
    "password":""
}
 
 */

export async function updateUser(req, res) {
    try {
        if (req.body) {
            console.log(req.body);
            const userId = req?.body?.id;

            if (!userId) {
                return res.status(401).send({ error: "Unauthorized access" });
            }

            const body = req.body;
            const id = req.body.id;

            // Update the data using Mongoose's Promise-based API
            const updatedUser = await userModel.updateOne({ _id: id }, body);

            if (updatedUser.nModified === 0) {
                return res.status(404).send({ error: "User not found or no modifications made" });
            }

            const updatedUserData = await userModel.findOne({ _id: id });
            return res.status(200).send({ msg: "Record updated successfully", data: updatedUserData });
        }
    } catch (error) {
        console.error("Error updating user:", error);
        return res.status(500).send({ error: "Internal server error" });
    }
}


/** GET :http://localhost:5000/api/generateOTP */

export async function generatepasswordOTP(req, res) {

    req.app.locals.OTP = await otpGenerator.generate(6, { lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false })
    res.status(201).send({ code: req.app.locals.OTP })

}

/** GET :http://localhost:5000/api/verifyOTP */
export async function verifyOTP(req, res) {
    const { code } = req.query;
    if (parseInt(req.app.locals.OTP) === parseInt(code)) {
        req.app.locals.OTP = null; // reset the OTP value
        req.app.locals.resetSession = true; // start session for reset password
        return res.status(201).send({ msg: 'Verify Successsfully!' })
    }
    return res.status(400).send({ error: "Invalid OTP" });
}

//successfully redirect user when OTP is valid
/** GET :http://localhost:5000/api/createResetSession */
// export async function createResetSession(req, res) {
//     if (req.app.locals.resetSession) {
//         return res.status(201).send({ flag: req.app.locals.resetSession })
//     }
//     return res.status(440).send({ error: "Session expired!" })
// }


//update the password when we have valid session
/** PUT :http://localhost:5000/api/resetPassword */
export async function resetPassword(req, res) {
    try {
        console.log("Reset password request received");
   

       
        const { name, password } = req.body;

        console.log("Reset password for user:", name);

        const user = await userModel.findOne({ name });

        if (!user) {
            console.log("User not found:", name);
            return res.status(404).send({ error: "Username not found" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await userModel.updateOne({ name: user.name }, { password: hashedPassword });

        req.app.locals.resetSession = false; // Reset session

        console.log("Password reset successfully for user:", name);

        return res.status(201).send({ msg: "Record Updated!" });
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).send({ error: "Internal server error" });
    }
}


