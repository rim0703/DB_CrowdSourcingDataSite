const express=require('express');
const { isLoggedIn,isNotLoggedIn } = require('./middlewares');
const User = require('../models/user');
const Apply=require('../models/apply');
const {Op} =require('sequelize');

const router=express.Router();

//회원정보페이지
router.get('/profile_update',isLoggedIn,(req,res)=>{
    res.render('profile_update',{title:'내 정보'});
});

//회원정보 수정 라우터 db연동
router.put('/submit/:id',isLoggedIn,async (req,res,next)=>{
    let id=req.params.id;
    let body=req.body;
    if(body.age==0){body.age=null};
    if(body.birth=='') {body.birth=null};
    if(body.addr==''){body.addr=null};
    if(body.phone==''){body.phone=null};
    await User.update({
        email:body.email,
        username:body.username,
        sex:body.sex,
        age:body.age,
        date_of_birth:body.birth,
        address:body.addr,
        cellphone:body.phone
    },{
        where: {id:id}
    })
    .then(result=>{
        console.log("정보수정 성공!");
        res.send(`<script type="text/javascript">alert("수정성공! 직전페이지로 돌아갑니다!");history.back();</script>`);
    })
    .catch(err=>{
        console.error(err);
        res.send(`<script type="text/javascript">alert("수정실패! 다시 시도하세요!");history.back();</script>`)
    }) 

});

//비밀번호 수정 페이지
router.get('/change_pw',isLoggedIn,(req,res)=>{
    res.render('change_pw',{title:'비밀번호 수정'});
});
//비밀번호 수정 요청
router.put('/password/:id',isLoggedIn,async(req,res,next)=>{
    let id=req.params.id;
    let body=req.body;
    await User.update({
        password:body.new_pw,
    },{
        where:{id:id}
    })
    .then(resutl=>{
        console.log("비밀번호 수정 성공!");
        res.send(`<script type="text/javascript">alert("수정성공! 새 비밀번호로 로그인하세요!");location.href="/auth/logout";</script>`);
    })
    .catch(err=>{
        console.log("비밀번호 수정 실패!")
        res.send(`<script type="text/javascript">alert("비밀번호 수정 실패!");history.back();</script>`);
    });
});

//회원탈퇴(클릭 즉시 탈퇴진행)
router.delete('/delete_user/:id',isLoggedIn,async (req,res,next)=>{
    let delete_id=req.params.id;
    await User.destroy({
        where:{id:delete_id}
    })
    .then(result=>{
        res.send(`<script type="text/javascript">alert("성공적으로 탈퇴하셨습니다!");location.href="/";</script>`);
    })
    .catch(err=>{
        console.log("회원탈퇴 실패!");
        res.send(`<script type="text/javascript">alert("ERROR:탈퇴실패!");history.back();</script>`);
    });
});

//전체 회원 통계자료
router.get('/stat',isLoggedIn,(req,res)=>{
    res.render('/user_list',{title:'회원통계정보'});
})
//회원 아이디 클릭 시 개인별 프로필 페이지 이동
router.get('/stat/:id',isLoggedIn,async(req,res,next)=>{
    var id=req.params.id;
    const users = await User.findAll({
        where:{id:id}
    })
    const applys=await Apply.findAll({
        where:{user_id:id}
    })
    //console.log(user);
    res.render('profile_search',{users,applys});
    console.log("회원정보 조회성공!");
})
//컬럼별 회원 검색
router.get('/search', isLoggedIn, async(req, res,next)=>{
    var searchType=req.query.searchType;
    var searchText=req.query.searchText;
    console.log(req.query);
    //아이디별 검색
    if(searchType=='id'){
        const users=await User.findAll({
            where:{id:{[Op.substring]:searchText}}
        })
        console.log({users});
        res.render('user_list',{users});
    }
    //유형별 검색
    if(searchType=='role'){
        if(searchText=='관리자'){
            searchText=0;
        }
        if(searchText=='제출자'){
            searchText=1;
        }
        if(searchText=='평가자'){
            searchText=2;
        }

        const users=await User.findAll({
            where:{role:searchText}
        })
        console.log({users});
        res.render('user_list',{users});
    }
    //나이 검색
    if(searchType=='age'){
        const users=await User.findAll({
            where:{age:searchText}
        })
        console.log({users});
        res.render('user_list',{users});
    }

    //성별 검색
    if(searchType=='sex'){
        const users=await User.findAll({
            where:{sex:searchText}
        })
        console.log({users});
        res.render('user_list',{users});
    }
    //TO DO: 태스크 검색 
    if(searchType=='task'){
        const users=await User.findAll({
            include:[{
                model: Apply,
                where:{
                    task_name:{[Op.substring]:searchText},
                    is_approved:true
                }
            }]
        })
        console.log(users);
        res.render('user_list',{users});
    }
    
});


module.exports=router;