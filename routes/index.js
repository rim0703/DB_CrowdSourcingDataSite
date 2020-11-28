const express=require('express');
const {isLoggedIn, isNotLoggedIn}=require('./middlewares');
const router=express.Router();
const User=require('../models/user');


router.use((req,res,next)=>{
    res.locals.user=req.user;
    res.locals.followerCount=0;
    res.locals.followingCount=0;
    res.locals.followerIdList=[];
    next();
});

router.get('/profile',isLoggedIn,(req,res)=>{
    res.render('profile',{tiltle:'내 정보'});
});

router.get('/join',isNotLoggedIn,(req,res)=>{
    res.render('join',{tiltle:'회원가입'});
});

router.get('/',(req,res,next)=>{
    res.render('main',{
        tiltle:"Main",
    });
});
router.get('/main',isLoggedIn,(req,res,next)=>{
    res.render('welcome',{
        tiltle:"환영합니다!",
    });
});

router.get('/userinfo/stat',async(req,res,next)=>{
    try{
        const users=await User.findAll();
        //console.log(users);
        res.render('user_list',{users});
    } catch(err){
        console.error(err);
        next(err);
    }
});



module.exports=router;