const User = require('../models/userModel')
const nodemailer = require('nodemailer')

const UserotpVerification = require('../models/userOTPverification')

const bcrypt =  require('bcrypt')
require('dotenv').config()

const securepassword = async(password) =>{

    try {

        const passwordHash = await bcrypt.hash(password,10)
        return passwordHash
        
    } catch (error) {
        console.log(error.message)
    }
} 

// otp.....

const sendVerifyMail = async(email,user_id,res)=>{

    try {
        
        // generate a random 4 digit otp
        const otp = Math.floor(1000+Math.random() * 9000).toString() 
        const transporter = nodemailer.createTransport({
            host:'smtp.gmail.com',
            port:587,
            secure:false,
            requireTLS:true,
            auth:{
                user:process.env.AUTH_EMAIL,
                pass:process.env.AUTH_PASS  //You should provide your password here
            }
        })

        const mailOptions = {
            from:'ssameen584@gmail.com',
            to:email,
            subject:'For Verification',
            html:`<p>Enter ${otp} in the app to verify your email address.</p>`
        }
        await UserotpVerification.deleteOne({userId: user_id})
        const info = await transporter.sendMail(mailOptions)

        console.log('Email has been sent',info.response)

        // save the OTP and its expiration timpstamp to the database
        const otpVerification = new UserotpVerification({
            userId:user_id,
            otp:otp,
            createdAt:new Date(),
            expiresAt:new Date(Date.now() + 5 * 60 * 1000 ) //set expiration to 5 minutes from now
        }) 

        await otpVerification.save()

    } catch (error) {
        console.log('Error sending verification email:',error)
        res.render('registration',{message:'error sending verification email'})
        return;
    }

}

const loadRegister = async(req,res) => {
    try {

        res.render('registration')
        
    } catch (error) {

        console.log(error.message)
    }
}

const insertUser = async(req,res) => {

    try {

        const name = req.body.name
        const email = req.body.email
        const mobile = req.body.mobile
        const image = req.file.filename
        const password = req.body.password
        const spassword = await securepassword(req.body.password)

        const exitEmail = await User.findOne({email:email})
        if(exitEmail){
            res.render('registration',{message:'Email already exist',exist:true})
        }

        const user = new User({
            name:name,
            email:email,
            mobile:mobile,
            image:image,
            password:spassword,
            is_admin:0,
            is_varified:0
        })

        const userData = await user.save()
        
        if (userData) {
           
            sendVerifyMail(req.body.email,userData._id,res)
            res.redirect(`/verifyMail/${userData._id}`)
            // res.render('registration',{message:'your registration has been successfull, Please verify your mail.'})
        }else{
            res.render('registration',{message:'your registration has been failed.'})
        }

    } catch (error) {
        console.log(error.message)
    }
}

// login user method started
const loginLoad = async(req,res) => {

    try {

        res.render('login')

    } catch (error) {
        console.log(error.message)
    }
}

// login verification
const verifyLogin = async(req,res) => {

    try {

        const email = req.body.email
        const password = req.body.password

        const userData = await User.findOne({email:email})

        if (userData) {
            
            const passwordMatch = await bcrypt.compare(password,userData.password)

            if (passwordMatch) {

                if (userData.is_varified === 0) {

                    res.render('login',{message:'Please verify your mail.'})

                } else {

                    req.session.user_id = userData._id
                    res.redirect('/home')
                }
            } else {
                res.render('login',{message:'Email and password is incorrect'})
            }

        } else {
            res.render('login',{message:'Email and password is incorrect'})
        }
        
    } catch (error) {

        console.log(error.message)
        
    }

}

const loadHome  = async (req,res) =>{
     
    try {

        res.render('home')
        
    } catch (error) {

        console.log(error.message)
        
    }
}

const userLogout = async(req,res) => {

    try {

        req.session.destroy()
        res.redirect('/')
        
    } catch (error) {

        console.log(error.message)
        
    }
}

const verifyMail = async(req,res) => {
    try {
        
       const updateInfo = await User.updateOne({_id:req.query.id},{$set: {is_varified:1 }})

       console.log(updateInfo)
       res.render('verifyMail',{userId:req.params.id})

    } catch (error) {
        console.log(error.message)
    }
}

const resendOtp = async(req,res) =>{
    try {
        const userId = req.params.id
        const user = await User.findOne({_id: userId})

        if(!user){
            return res.status(404).send('user not found')
        }

        // resend the otp
        sendVerifyMail(user.email,userId,res)

        res.redirect(`/verifyMail/${userId}`)

    } catch (error) {
        console.log(error.message)
        res.status(500).send('Internal server Error')
    }
}

const verifyOtp = async(req,res) =>{

    try {
        
        const userId = req.body.userId
        const enteredOtp = req.body.otp

        // retrieve user otp from the database

        const userotp = await UserotpVerification.findOne({userId:userId})

        if(userotp && userotp.otp === enteredOtp && userotp.expiresAt > new Date()){
            // otp is valid ,update user verification status
            await User.updateOne({_id:userId},{$set : { is_verified : 1 }})

            // redirect to the login page
            res.redirect('/login')
        }else{
            // Invalid Otp or Expired
            res.render('verifyMail',{ error:'Invalid OTP or OTP has expired', userId : userId})
        }

    } catch (error) {
        console.log(error.message)
        res.render('verifyMail',{ error: ' An error occurred', userId : userId })
    }
}

// forget password code start

const forgetLoad = async(req,res)=>{

    try {
        
        res.render('forget')

    } catch (error) {
        console.log(error.message)
    }

}

const forgetVerify = async(req,res)=>{

    try {
        
        const email = req.body.email
        const userData = await User.findOne({email:email})

        if(userData){

            

        }else{
            res.render('Forget',{message:'Mail is incorrect.'})
        }

    } catch (error) {
        console.log(error.message)
    }

}

module.exports = {
    loadRegister,
    insertUser,
    loginLoad,
    verifyLogin,
    loadHome,
    userLogout,
    verifyMail,
    verifyOtp,
    resendOtp,
    forgetLoad,
    forgetVerify

    

}