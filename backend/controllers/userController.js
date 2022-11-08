const asyncHandler = require('express-async-handler')
const User = require('../models/userModel')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Token = require('../models/tokenModel')
const crypto = require('crypto')
const sendEmail = require('../utils/sendEmail')

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
      const token = req.cookies.token
      if (!token) {
        return res.json(false)
      }

      const verified = jwt.verify(token, process.env.JWT_SECRET)
      if (verified) {
        return res.json(true)
      }
      return res.json(false)
})

// update user
const updateUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)
    if (user) {
        const {name, email, photos, phone, bio } = user
        user.email = email,
        user.name = req.body.name || name
        user.phone = req.body.phone || phone
        user.bio = req.body.bio || bio
        user.photos = req.body.photos || photos

        const updatedUser = await user.save()
        res.status(200).json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            photos: updatedUser.photos,
            phone: updatedUser.phone,
            bio: updatedUser.bio 
        })
    } else {
        res.status(404)
        throw new Error('User not found')
    }
})

// change password
const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
  const {oldPassword, password} = req.body

  if (!user) {
    res.status(400)
    throw new Error('User not found, plase signup')
  }

  //validate
  if (!oldPassword || !password) {
    res.status(400)
    throw new Error('Please add old and new password')
  }

  //check if password match
  const passwordIsCorrect = await bcrypt.compare(oldPassword, user.password)

  //save new password
  if (user && passwordIsCorrect) {
    user.password = password
    await user.save()
    res.status(200).send('Password has been changed')
  } else {
    throw new Error('Old password is incorrect ')
  }
})

const forgotPassword = asyncHandler(async(req, res) => {
    const {email} = req.body
    const user = await User.findOne({email})

    if (!user) {
        res.status(404)
        throw new Error('User does not exist')
    }

    //create reset token
    let resetToken = crypto.randomBytes(32).toString('hex') + user._id

    //hash token
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex')

    // save token
    await new Token({
        userId: user._id,
        token: hashedToken,
        createdAt: Date.now(),
        expiresAt: Date.now() + 30 * (60*1000)
    }).save()

    // construct reset url     
    const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`

    const message = `
    <h2>Hello ${user.name}</h2>
    <p>Please use the url below to reset your password</p>
    <p>This is link valid for reset your password</p>

    <a href=${resetUrl} clicktracking=off>${resetUrl}</a>
    <p>Regards..</p>
    `
    const subject = 'Password Reset Request'
    const send_to = user.email
    const send_from = process.env.EMAIL_USER

    try {
        await sendEmail(subject, message, send_to, send_from)
        res.status(200).json({Success: true, message: 'Reset email send'})
    } catch (error) {
        res.status(500)
        throw new Error('email not send, please try again')
    }
})

module.exports = {
    registerUser,
    loginUser,
    logout,
    getUser,
    loginStatus,
    updateUser,
    changePassword,
    forgotPassword,
} 
