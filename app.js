var express = require('express');
const cookieParser = require('cookie-parser');
var path=require('path');
var morgan=require('morgan');
var session=require('express-session');
var dotenv=require('dotenv');
var nunjucks=require('nunjucks');
var passport=require('passport');
var methodOverride=require('method-override');
var bodyParser=require('body-parser');


dotenv.config();
var pageRouter=require('./routes/index');
const{sequelize}=require('./models');
const passportConfig=require('./passport');
const authRouter=require('./routes/auth');
const userinfoRouter=require('./routes/userinfo');
const taskSysRouter=require('./routes/task_sys');

var app = express();
passportConfig();
app.set('port',process.env.PORT || 3000);
app.set('view engine','html');

sequelize.sync({force:false})
    .then(()=>{
        console.log('DB 연결 성공!');
    })
    .catch((err)=>{
        console.error(err);
    });
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname,'public')));
app.use(express.json());
app.use(express.urlencoded({extended:false}));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(session({
    resave:false,
    saveUninitialized:false,
    secret:process.env.COOKIE_SECRET,
    cookie:{
        httpOnly:true,
        secure:false,
    },
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());
app.use(methodOverride('_method'));
app.use('/',pageRouter);
app.use('/auth',authRouter);
app.use('/userinfo',userinfoRouter);
app.use('/task_sys',taskSysRouter);

//front-end?
app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js')); // redirect bootstrap JS
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css')); // redirect CSS bootstrap


app.use((req,res,next)=>{
    const error=new Error(`${req.method} ${req.url} 라우터가 없습니다!`);
    error.status=404;
    //error.status=500;
    next(error);
});

nunjucks.configure('views',{
    express:app,
    watch:true,
});



app.listen(app.get('port'),()=>{
    console.log(app.get('port'),'번 포트에서 대기중...');
});

