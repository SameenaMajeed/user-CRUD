const dotenv = require('dotenv')
dotenv.config({path:'./config.env'})


const mongoose = require('mongoose')
mongoose.connect('mongodb://127.0.0.1:27017/UserMGT')

const express = require('express')
const app = express()

// for user routes
const userRoute = require('./routes/userRoute')
app.use('/', userRoute )
app.use('/login', userRoute )

// for admin route
const adminRoute = require('./routes/adminRoute')
app.use('/admin', adminRoute )

const port = process.env.PORT
app.listen(port || 3000,() => console.log('Server is Running....'))