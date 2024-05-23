const express = require('express')
const user_route = express()

const session = require('express-session')
const config = require('../config/config')

const path = require('path')

const cookieParser = require('cookie-parser');
user_route.use(cookieParser());

user_route.use(session({
    secret:config.sessionSecret,
    resave:false,
    saveUninitialized:true,
    cookie:{maxAge:600000}
}))

// back button of browser
user_route.use((req, res, next) => {
    res.set('cache-control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    res.set('Expires', '0');
    res.set('Pragma', 'no-cache');
    next();
});


user_route.use('/public',express.static('public'))
// user_route.use(express.static(path.join(__dirname + 'public')));

const auth = require ('../middleware/auth')

user_route.set('view engine','ejs')
user_route.set('views','./views/users')

const bodyParser = require('body-parser')
user_route.use(bodyParser.json())
user_route.use(bodyParser.urlencoded({extended:true}))

const multer = require('multer')
const storage = multer.diskStorage({
    destination:(req,res,cd) => {
        cd(null,path.join(__dirname,'../public/userImages'))
    },
    filename:(req,file,cd) => {
        const name = Date.now()+'-'+file.originalname
        cd(null,name)
    }
})

const upload = multer({storage:storage})

const userController = require('../controllers/userController')

user_route.get('/register',auth.isLogout,userController.loadRegister)

user_route.post('/register',upload.single('image'),userController.insertUser)

user_route.get('/verifyMail/:id',userController.verifyMail)
user_route.post('/verifyMail',userController.verifyOtp)

user_route.get('/resendOtp/:id',userController.resendOtp)

user_route.get('/',auth.isLogout,userController.loginLoad)
user_route.get('/login',auth.isLogout,userController.loginLoad)

user_route.post('/login',userController.verifyLogin)

user_route.get('/home',auth.isLogin,userController.loadHome)

user_route.post('/logout',userController.userLogout)

user_route.get('/forget',auth.isLogout,userController.forgetLoad)

user_route.post('/forget',userController.forgetVerify)

module.exports = user_route