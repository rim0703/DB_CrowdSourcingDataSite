const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

const User = require('../models/user');

module.exports = () => {
  passport.use(new LocalStrategy({
    usernameField: 'id',
    passwordField: 'password',
  }, async (id, password, done) => {
    try {
      const exUser = await User.findOne({ where: { id } });
      if (exUser) {
        //const result = await bcrypt.compare(password, exUser.password);
        if (password==exUser.password) {
          done(null, exUser);
        } else {
          done(null, false, { message: '<script type="text/javascript">alert("비밀번호 오류, 다시 로그인하세요!");history.back();</script>' });
        }
      } else {
        done(null, false, { message: '<script type="text/javascript">alert("가입되지 않은 회원입니다!");history.back();</script>' });
      }
    } catch (error) {
      console.error(error);
      done(error);
    }
  }));
};