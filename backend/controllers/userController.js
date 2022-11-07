const asyncHandler = require('express-async-handler')
const User = require('../models/userModel')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const generateToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET, {expiresIn: '1d'})
}

//register user
const registerUser = asyncHandler( async (req, res) => {
    const {name, email, password} = req.body

    //validation
    if (!name || !email || !password) {
        res.status(400)
        throw new Error('Please fill in all required fields')
    }
    if (password.length < 6) {
        res.status(400)
        throw new Error('Password must be have min 6 character')
    }
    //cek if user email already exist
    const userExists = await User.findOne({email})
    if (userExists) {
        res.status(400)
        throw new Error('Email has already been registered!')
    }


    //create new user
    const user = await User.create({
        name,
        email,
        password,
    })
    //generate token
    const token = generateToken(user._id)

    //send http.only cookie
    res.cookie('token', token, {
        httpOnly: true,
        expires: new Date(Date.now() + 1000 * 86400), //1day
    })

    if (user) {
        const {_id, name, email, photos, bio} = user
        res.status(201).json({
            _id, name, email, photos, bio, token
        })
    } else {
        throw new Error('Invalid user data')
    }
})

//login user
const loginUser = asyncHandler(async(req, res) => {
    const {email, password} = req.body

    //validate request
    if (!email || !password) {
        throw new Error('Please add email and password')
    }

    //cek user exist
    const user = await User.findOne ({email})

    if (!user) {
        res.status(400)
        throw new Error('User not found, please signup')
    }

    //user exist if password correct
    const passwordIsCorrect = await bcrypt.compare(password, user.password)

    if (user && passwordIsCorrect) {
        const token = generateToken(user._id)
        res.cookie('token', token, {
            httpOnly: true,
            expires: new Date(Date.now() + 1000 * 86400), //1day
        })
        const { _id, name, email, photos, phone, bio } = user
        res.status(200).json({
            _id,
            name,
            email,
            photos,
            phone,
            bio,
            token,
        })
    } else {
        res.status(400)
        throw new Error('Invalid email or password!')
    }

})

//logout user
const logout = asyncHandler(async(req, res) => {
    const token = generateToken(User._id)
    res.cookie('token', token, {
        httpOnly: true,
    })
    return res.status(200).json({message: "Successfully logout"})  
})

//get user data
const getUser = asyncHandler(async(req, res) => {
    const user = await User.findById(req.user._id)
    if (user) {
        const { _id, name, email, photos, phone, bio } = user
        res.status(201).json({
            _id,
            name,
            email,
            photos,
            phone,
            bio
        })
    } else {
        res.status(400);
        throw new Error('User not found')
    }
})

//get login status
const loginStatus = asyncHandler(async(req, res) => {
      
})

module.exports = {
    registerUser,
    loginUser,
    logout,
    getUser,
    loginStatus
} 
