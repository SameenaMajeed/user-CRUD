const User = require('../models/userModel')
const bcrypt = require('bcrypt')
const randomstring = require('randomstring')

const loadLogin = async(req,res) => {
    try {
        
        res.render('login')
        
    } catch (error) {
        console.log(error.message)
    }
}

const securepassword = async(password) =>{

    try {

        const passwordHash = await bcrypt.hash(password,10)
        return passwordHash
        
    } catch (error) {
        console.log(error.message)
    }
} 


const verifyLogin = async (req,res) => {

    try {
        
        const email = req.body.email
        const password = req.body.password

        const userData =  await User.findOne({email:email})
        if (userData) {
            
            const passwordMatch = await bcrypt.compare(password,userData.password)
            if (passwordMatch) {
            
                if(userData.is_admin === 0){
                    res.render('login',{message:'Email and password is incorrect'})
                }else{
                    req.session.user_id = userData._id
                    res.redirect('/admin/home')
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

const loadDashboard = async(req,res) => {
    try {

        const userData = await User.findById({_id:req.session.user_id})
        res.render('home',{admin:userData})

    } catch (error) {
        console.log(error.message)
    }
}

const logout = async(req,res) => {
    try {
        
        req.session.destroy()
        res.redirect('/admin')

    } catch (error) {
        console.log(error.message)
    }
}

const adminDashboard = async (req, res) => {
    try {
        const search = req.query.search;
        let usersDetails;

        if (search) {
            // If a search query is present, filter users by name, email, or mobile
            usersDetails = await User.find({
                is_admin: 0,
                $or: [
                    { name: { $regex:req.query.search, $options: 'i' } },
                    { email: { $regex:req.query.search, $options: 'i' } },
                    { mobile: { $regex:req.query.search, $options: 'i' } }
                ]
            });
        } else {
            // If no search query is present, get all non-admin users
            usersDetails = await User.find({ is_admin: 0 });
        }

        res.render('dashboard', { users:usersDetails });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};

const newUserLoad = async (req,res) => {
    try {
        
        res.render('new-user')

    } catch (error) {
        console.log(error.message)
    }
}

const addUser = async(req,res) => {
    try {
 
        const name = req.body.name
        const email = req.body.email
        const mobile = req.body.mobile
        const image = req.file.filename
        const password = req.body.password
        // const password = randomstring.generate(8)

        const spassword = await securepassword(password)
        const exitEmail = await User.findOne({email:email})
        if(exitEmail){
            res.render('new-user',{message:'Email already exist',exist:true})
        }

        const user = new User({
            name:name,
            email:email,
            mobile:mobile,
            image:image,
            password:spassword,
            is_admin:0
        })

        const userData = await user.save()

        if (userData) {
            
            res.redirect('/admin/dashboard')

        } else {
            res.render('new-user',{message:'Something Wrong'})
        }
        
    } catch (error) {
        console.log(error.message)
    }
}

const editUserLoad = async(req,res) => {
    try {
        
        const id = req.query.id
        const userData = await User.findById({_id:id})

        if(userData){
            res.render('edit-user',{user:userData})
        }else{
            res.redirect('/admin/dashboard')
        }

        res.render('edit-user')

    } catch (error) {
        console.log(error.message)
    }
}

const updateUser = async(req,res) => {
    try {
        
       const userData = await User.findByIdAndUpdate({_id:req.body.id},{ $set:{name:req.body.name , email:req.body.email , mobile:req.body.mobile , is_varified:req.body.verify }})

       res.redirect('/admin/dashboard')

    } catch (error) {
        console.log(error.message)
    }
}

const deleteUser = async(req,res) => {
    try {
        
        const id = req.query.id
        await User.deleteOne({ _id:id})
        res.redirect('/admin/dashboard')

    } catch (error) {
        console.log(error.message)
    }
}

module.exports = {
    loadLogin,
    verifyLogin,
    loadDashboard,
    logout,
    adminDashboard,
    newUserLoad,
    addUser,
    editUserLoad,
    updateUser,
    deleteUser
}