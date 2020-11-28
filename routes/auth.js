const express = require('express');
const passport = require('passport');
//const bcrypt = require('bcrypt');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const User = require('../models/user');

const router = express.Router();
//회원가입 라우터
router.post('/join', isNotLoggedIn, async (req, res, next) => {
  const { id, password,email,username,sex,age,date_of_birth,address,cellphone,role } = req.body;
  try {
    const exUser = await User.findOne({ where: { id } });
    if (exUser) {
      return res.sned('/main?error=exist');
    }
    //비밀번호 암호화
    //const hash = await bcrypt.hash(password, 12);
    await User.create({
      id,
      password,
      email,
      username,
      sex,
      age,
      date_of_birth,
      address,
      cellphone,
      role,
      score:0,
      created_at:Date(),
    });
    return res.send(`<script type="text/javascript">alert("회원가입에 성공하셨습니다! 로그인하세요!");history.back();</script>`);
  } catch (error) {
    console.error(error);
    return res.send(`<script type="text/javascript">alert("회원가입 실패! 다시시도하세요!");history.back();</script>`);
  }
});

//로그인 라우터
router.post('/login', isNotLoggedIn, (req, res, next) => {
  passport.authenticate('local', (authError, user, info) => {
    if (authError) {
      console.error(authError);
      return next(authError);
    }
    if (!user) {
      //res.redirect(`/?loginError`);
      return res.send(`${info.message}`);
    }
    return req.login(user, (loginError) => {
      if (loginError) {
        console.error(loginError);
        return next(loginError);
      }
      return res.redirect('/');
    });
  })(req, res, next); // 미들웨어 내의 미들웨어에는 (req, res, next)를 붙입니다.
});

//로그아웃 라우터
router.get('/logout', isLoggedIn, (req, res) => {
  req.logout();
  req.session.destroy();
  res.redirect('/');
});



module.exports = router;