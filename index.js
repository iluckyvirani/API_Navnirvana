import express from 'express';
import cors from 'cors';
import morgan from  'morgan';
 import connect from './database/connection.js';
import router from './router/route.js';
import crypto from 'crypto'

const app = express();


//middleware
 app.use(express.json());
 app.use(cors());
 app.use(morgan('tiny'));
 app.disable('x-powered-by'); //less hackers know about our stack


 const port = 5000;


// when we want jwt secret simply run npm i crypto then add below code after getting the secret hidden this code
 // Generate JWT secret key
// const jwtSecret = crypto.randomBytes(32).toString('base64');

// console.log(jwtSecret);
// HTTP GET request
app.get('/',(req,res)=>{

res.status(201).json("get request");

});

// api routes

app.use('/api', router)






// start server only when we have valid connection
connect().then(()=>{
    try{
        app.listen(port, ()=>{
            console.log(`server connected to http://localhost:${port}`);
        })

    }
    catch(error){
        console.log("cannot connect to the server ")
    }
}).catch(error =>{
    console.log("Invaild database connection");
})
