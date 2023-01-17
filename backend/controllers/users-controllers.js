const { validationResult } = require('express-validator')
const bcrypt = require('bcryptjs');

const HttpError = require('../models/http-error');
const User = require('../models/user');


const getUsers = async (req, res, next) => {
    let users;
    try {
      users = await User.find({}, '-password');
    } catch (err) {
      const error = new HttpError(
        'Fetching users failed, please try again later.',
        500
      );
      return next(error);
    }
    res.json({users: users.map(user => user.toObject({ getters: true }))});
  };

const signup = async(req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(
            new HttpError('Invalid inputs passed, please check your data.', 422)
          );
    }

    const { username, firstname, lastname, address, email, password } = req.body;


    let existingUser
    try {
        existingUser = await User.findOne({ $or: [{ username: username }, { email: email }] })
    } catch (err) {
        const error = new HttpError(
            'Signing up failed, please try again later.',
            500
        );
        return next(error);
    }

    if (existingUser) {
        const error = new HttpError(
            'User exists already, please login instead.',
            422
        );
        return next(error)
    }

    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, 12);
    } catch (err) {
        const error = new HttpError('Could not create user, please try again.',
        500
      );
      return next(error);
    };
    


    const createdUser = new User({
        username,
        firstname,
        lastname,
        address,
        email,
        password: hashedPassword
    });

    try {
        await createdUser.save()
    } catch (err) {
        const error = new HttpError(
            'Signing up failed, please try again.',
            500
        );
        return next(error);
    }

    res.status(201).json({user: createdUser.toObject({ getters: true })});
};


const login = async (req, res, next) => {
    const { email, password } = req.body;
  
    let existingUser;
  
    try {
      existingUser = await User.findOne({ email: email })
    } catch (err) {
      const error = new HttpError(
        'Logging in failed, please try again later.',
        500
      );
      return next(error);
    }
  
    if (!existingUser) {
      const error = new HttpError(
        'Invalid credentials, could not log you in.',
        401
      );
      return next(error);
    }
    
    let isValidPassword = false;
    try {
      isValidPassword = await bcrypt.compare(password, existingUser.password);
    } catch (err) {
        const error = new HttpError('Could not log you in, please check your credentials and try',
        500
      );
      return next(error);
    }

    if (!isValidPassword) {
      const error = new HttpError(
        'Invalid credentials, could not log you in.',
        401
      );
      return next(error);
    }

  
    res.json({message: 'Logged in!'});
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;