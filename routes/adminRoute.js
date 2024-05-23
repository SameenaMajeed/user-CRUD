const express = require('express')
const admin_route = express()

const session = require('express-session')
const config = require('../config/config')
admin_route.use(session({
    secret:config.sessionSecret,
    resave:false,
    saveUninitialized:true,
}))

admin_route.use((req, res, next) => {
    res.set('cache-control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    res.set('Expires', '0');
    res.set('Pragma', 'no-cache');
    next();
});

const bodyParser = require('body-parser')
admin_route.use(bodyParser.json())
admin_route.use(bodyParser.urlencoded({extended:true}))

admin_route.set('view engine','ejs')
admin_route.set('views','./views/admin')

const path = require('path')
admin_route.use('/public',express.static('public'))

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

const auth = require('../middleware/adminAuth')

const adminController = require('../controllers/adminController')

admin_route.get('/',auth.isLogout,adminController.loadLogin)

admin_route.post('/login',adminController.verifyLogin)

admin_route.get('/home',auth.islogin,adminController.loadDashboard)

admin_route.get('/logout',auth.islogin,adminController.logout)

admin_route.get('/dashboard',adminController.adminDashboard)

admin_route.get('/new-user',auth.islogin,adminController.newUserLoad)

admin_route.post('/new-user',upload.single('image'),adminController.addUser)

admin_route.get('/edit-user',auth.islogin,adminController.editUserLoad)

admin_route.post('/edit-user',adminController.updateUser)

admin_route.get('/delete-user',adminController.deleteUser)

admin_route.get('*', (req,res) => {
    res.redirect('/admin')
})

module.exports = admin_route
