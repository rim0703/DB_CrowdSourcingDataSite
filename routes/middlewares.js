//const { noExtendLeft, ne } = require("sequelize/types/lib/operators");

exports.isLoggedIn=(req,res,next)=>{
    if(req.isAuthenticated()){
        next();
    }else{
        res.status(403).send(`<script type="text/javascript">alert("로그인 후 사용하세요!");location.href="/";</script>`);

    }
};

exports.isNotLoggedIn=(req,res,next)=>{
    if(!req.isAuthenticated()){
        next();
    }else{
        const message=encodeURIComponent('로그인 상태입니다!');
        res.redirect(`/?error=${message}`);
    }
};