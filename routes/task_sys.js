const express=require('express');
const { isLoggedIn,isNotLoggedIn } = require('./middlewares');

const Task=require('../models/task');
const ODT=require('../models/original_data_type');
const Apply=require('../models/apply');
const User=require('../models/user');
const pdf=require('../models/pars_data_seq_file');
var mysql = require('mysql2');
var database=require('../config/config.json');
var multer=require('multer');
var upload=multer({dest:'uploads/'});
const parse=require('csv-parse/lib/sync');
const fs=require('fs');
const { sequelize } = require('../models/task');

var con = mysql.createConnection(database.db);

const router=express.Router();

/* 
    관리자 기능 구현 
*/

//태스크관리시스템 메인 페이지
router.get('/',isLoggedIn,(req,res)=>{
    res.render('task_sys',{title:'태스크 관리'});
})
//태스크추가하기 (폼)
router.get('/add',isLoggedIn,async(req,res,next)=>{
    res.render('./task_sys/add_task',{title:'새 태스크 추가'});
})
//태스크추가 후 DB제출
router.post('/add/submit',async(req,res,next)=>{
    try{
        var odt_name=await ODT.findOne({where:{name:req.body.odt_name}});
        if(odt_name){
            return res.send(`<script type="text/javascript">alert("같은 이름의 기본 데이터타입이 존재합니다! 뒤로돌아갑니다.");history.back();</script>`);
        }
        var table_schema=req.body.table_schema;
        var data_type=req.body.data_type;
        var schema_string='';
        var sql="CREATE TABLE IF NOT EXISTS "+req.body.task_table_name+' (';
        console.log(table_schema.length);
        console.log(data_type.length);
        if(Array.isArray(table_schema)){
            for(var i=0;i<table_schema.length;i++){
                if(data_type[i]=="string"){
                    console.log(sql);
                    schema_string+="문자열"+'/'+table_schema[i]+' ';
                    sql+=table_schema[i]+" VARCHAR(255), ";
                    console.log(sql);
                }
                if(data_type[i]=="int"){
                    schema_string+="정수"+'/'+table_schema[i]+' ';
                    sql+=table_schema[i]+" INTEGER, ";
                }
                if(data_type[i]=="double"){
                    schema_string+="소수"+'/'+table_schema[i]+' ';
                    sql+=table_schema[i]+" DOUBLE, ";
                }
                if(data_type[i]=="date"){
                    schema_string+="날짜(년,월,일)"+'/'+table_schema[i]+' ';
                    sql+=table_schema[i]+" DATE, ";
                }
                if(data_type[i]=="time"){
                    schema_string+="시간(시,분,초)"+'/'+table_schema[i]+' ';
                    sql+=table_schema[i]+" TIME, ";
                }
                if(data_type[i]=="datetime"){
                    schema_string+="날짜+시간"+'/'+table_schema[i]+' ';
                    sql+=table_schema[i]+" DATETIME, ";
                }
            }
        }
        else{
            if(data_type=="string"){
                console.log(sql);
                schema_string+="문자열"+'/'+table_schema+' ';
                sql+=table_schema+" VARCHAR(255), ";
                console.log(sql);
            }
            if(data_type=="int"){
                schema_string+="정수"+'/'+table_schema+' ';
                sql+=table_schema[i]+" INTEGER, ";
            }
            if(data_type=="double"){
                schema_string+="소수"+'/'+table_schema+' ';
                sql+=table_schema+" DOUBLE, ";
            }
            if(data_type=="date"){
                schema_string+="날짜(년,월,일)"+'/'+table_schema+' ';
                sql+=table_schema+" DATE, ";
            }
            if(data_type=="time"){
                schema_string+="시간(시,분,초)"+'/'+table_schema+' ';
                sql+=table_schema+" TIME, ";
            }
            if(data_type=="datetime"){
                schema_string+="날짜+시간"+'/'+table_schema+' ';
                sql+=table_schema+" DATETIME, ";
            }
        }
        sql=sql.slice(0,-2)+')';
        console.log(sql);   
        //동적DB로 새로운 데이터 테이블 만들기
        con.connect(function(err) {
            if (err) throw err;
            console.log("Connected!");
            con.query(sql, function (err, result) {
              if (err) throw err;
              console.log("Table created");
            });
        });
        //새로운 태스크 DB에추가
        var count=await Task.max('task_id');
        //console.log(count);
        count=count+1;
        var task=await Task.create({
            task_id:count,
            task_name:req.body.task_name,
            description:req.body.description,
            task_table_name:req.body.task_table_name,
            min_upload_freq:req.body.min_upload_freq,
            is_closed:false,
            table_schema:schema_string,
        });
        //새로운 기본(원본) 데이터 타입 만들기
        var odt=await ODT.create({
            t_id:count,
            name:req.body.odt_name,
            schema_info:req.body.schema_info,
            mapping_info:req.body.mapping_info
        });
        console.log('태스크에 새 ODT가 생성되었습니다!');
        console.log('새 태스크가 생성되었습니다!');
        var tasks=await Task.findAll();
        res.render('./task_sys/task_list',{tasks});
    }catch(err){
        console.error(err);
        next(err);
        res.send(`<script type="text/javascript">alert("태스크생성 에러! 뒤로돌아갑니다.");history.back();</script>`);
    }
});
//태스크리스트
router.get('/stat',isLoggedIn,async(req,res,next)=>{
    var tasks=await Task.findAll({
        include:[
            {
                model:Apply,
                required:false,
                attributes:['user_id','is_approved']
            }
        ]
    });
    console.log(tasks);
    console.log(tasks[0].Applies);
    //console.log(tasks[0].Applies.user_id);
    //console.log(tasks[0].Applies[0].user_id);
    //console.log(tasks[0].Apply.user_id);
    res.render('./task_sys/task_list',{tasks});
})

//태스크 삭제하기 (태스크ID 뒤에서부터 재사용가능)
router.delete('/delete/:id:table_name',isLoggedIn,async (req,res,next)=>{
    //STEP1:태스크 삭제
    let delete_id=req.params.id;
    let table_name=req.params.table_name;
    await Task.destroy({
        where:{task_id:delete_id}
    })
    //STEP2:ODT삭제
    await ODT.destroy({
        where:{t_id:delete_id}
    })
    //STEP3:데이터 테이블 삭제
    con.connect(function(err) {
        if (err) throw err;
        var sql = "DROP TABLE IF EXISTS "+table_name;
        console.log(sql);
        con.query(sql, function (err, result) {
          if (err) throw err;
          console.log("Table deleted");
        });
    });
    //STEP4:사용자로부터 신청받은 기록 삭제
    await Apply.destroy({
        where:{task_id:delete_id}
    })
    .then(result=>{
        console.log("태스크 삭제 성공!");
    })
    .catch(err=>{
        res.send(`<script type="text/javascript">alert("ODT생성 에러! 뒤로돌아갑니다.");history.back();</script>`);
        console.log(err);
        console.log("에러발생! 태스크 삭제 실패!");
    });
    var tasks=await Task.findAll();
    res.render('./task_sys/task_list',{tasks});
});
//태스크 원본 데이터타입 추가(폼)
router.get('/add_odt/:task_id',isLoggedIn,async(req,res,next)=>{
    var task_id=req.params.task_id;
    res.render('./task_sys/add_odt',{task_id, title:'원본데이터타입 추가'});
})
//태스크 원본 데이터타입 추가 후 제출
router.post('/add_odt/submit',async(req,res,next)=>{
    try{
        var odt=await ODT.create({
            t_id:req.body.task_id,
            name:req.body.name,
            schema_info:req.body.schema_info,
            mapping_info:req.body.mapping_info
        });
        console.log(odt);
        console.log('태스크에 새 ODT가 생성되었습니다!');
        var tasks=await Task.findAll();
        res.render('./task_sys/task_list',{tasks});
    }catch(err){
        console.error(err);
        next(err);
        res.send(`<script type="text/javascript">alert("ODT생성 에러! 뒤로돌아갑니다.");history.back();</script>`)
    }
})
//태스크별 정보 페이지
router.get('/info/:task_id',isLoggedIn,async(req,res,next)=>{
    try{
    var task=req.params.task_id;
    var tasks=await Task.findAll({
        where:{task_id:task}
    });
    var odts = await ODT.findAll({
        where:{t_id:task},
    });
    var task_id=tasks[0].task_id;
    var applys=await Apply.findAll({
        where:{task_id:task,
                is_approved:true},
    })
    var pdfs=await pdf.findAndCountAll({
        include:{
            model:Task,
            required:false,
            attributes:['task_name']
        }
    });
    var total_tuples=0;
    var passed_tuples=0;
    var score=0;
    var average_score=0;
    var passed_files_count=0;
    for(var i=0;i<pdfs.count;i++){
        if(pdfs.rows[i].is_passed==true){
            total_tuples+=pdfs.rows[i].num_total_tuples;
            passed_tuples+=pdfs.rows[i].num_total_tuples;
            score+=pdfs.row[i].quality_socre;
            passed_files_count++;
        }
        else{
            total_tuples+=pdfs.rows[i].num_total_tuples;
        }
    }
    average_score=(score/passed_files_count).toFixed(2);
    console.log(total_tuples,passed_tuples,average_score);
    res.render('./task_sys/task_info',{tasks,odts,task_id,applys,pdfs,total_tuples,passed_tuples,average_score});
}catch(err){
    console.error(err);
    res.send(`<script type="text/javascript">alert(" 에러! 뒤로돌아갑니다.");history.back();</script>`);
}
})
//태스크 참여자 승인/거절 페이지
router.get('/manage',isLoggedIn,async(req,res,next)=>{
    //console.log('페이지 전환 라우터');
    //User평가점수 반영하기
    var applys=await Apply.findAll({
    include:[
        {
            model:User,
            required:false,
            attributes:['id','score']
        }
    ]});
    res.render('./task_sys/task_manage',{applys});
})
router.get('/manage/:apply_id',isLoggedIn,async(req,res,next)=>{
    var check=await Apply.findOne({
        where:{apply_id:req.params.apply_id}
    })
    console.log(req.params);
    //console.log(check.is_approved);
    //console.log(check.is_approved=='');
    if(check.is_approved==null||check.is_approved==false){
        await Apply.update({
        is_approved:true
        },{
            where: {apply_id:req.params.apply_id}
        })
        .then(result=>{
            console.log("참여자의 태스크 참여를 허가하셨습니다!");
            res.send(`<script type="text/javascript">alert("참여자의 태스크 참여를 허가하셨습니다!");history.back();location.reload(true);</script>`);
        })
        .catch(err=>{
            console.error(err);
            res.send(`<script type="text/javascript">alert("허가권한 부여 에러!");history.back();</script>`)
        }) 
        }
    else if(check.is_approved==true){
        await Apply.update({
        is_approved:false
        },{
            where: {apply_id:req.params.apply_id}
        })
        .then(result=>{
            console.log("참여자의 태스크 참여를 취소하셨습니다!");
            res.send(`<script type="text/javascript">alert("참여자의 태스크 참여를 취소하셨습니다!");history.back();location.reload(true);</script>`);
        })
        .catch(err=>{
            console.error(err);
            res.send(`<script type="text/javascript">alert("허가권한 취소 에러!");history.back();</script>`)
        })
    }


})
//태스크 대기중 거절
router.get('/manage/disapprove/:apply_id',isLoggedIn,async(req,res,next)=>{
    var check=await Apply.findOne({
        where:{apply_id:req.params.apply_id}
    })
    console.log(req.params);
        await Apply.update({
        is_approved:false
        },{
            where: {apply_id:req.params.apply_id}
        })
        .then(result=>{
            console.log("참여자의 태스크 참여를 거절하셨습니다!");
            res.send(`<script type="text/javascript">alert("참여자의 태스크 참여를 거절하셨습니다!");history.back();location.reload(true);</script>`);
        })
        .catch(err=>{
            console.error(err);
            res.send(`<script type="text/javascript">alert("허가권한 취소 에러!");history.back();</script>`)
        })
})

//추가구현: 태스크 종료하기
router.get('/manage/close/:task_id',isLoggedIn,async(req,res,next)=>{
    await Task.update({
    is_closed:true
    },{
        where: {task_id:req.params.task_id}
    })
    .then(result=>{
        console.log("태스크참여를 종료하셨습니다!");
        res.send(`<script type="text/javascript">alert("태스크 참여를 종료하셨습니다!");history.back();location.reload(true);</script>`);
    })
    .catch(err=>{
        console.error(err);
        res.send(`<script type="text/javascript">alert("태스크 종료 에러!");history.back();</script>`)
    })
})



/*
    태스크 참여자 기능 구현
*/
router.get('/pre/:task_id',isLoggedIn,async(req,res,next)=>{
    var tasks=await Task.findAll({where:{task_id:req.params.task_id}});
    //console.log(tasks[0].Applies.user_id);
    //console.log(tasks[0].Applies[0].user_id);
    //console.log(tasks[0].Apply.user_id);
    res.render('./task_sys/pre_agreement',{tasks});
})
router.get('/:user_id/apply_:task_id',isLoggedIn,async(req,res,next)=>{
    var task_id=req.params.task_id;
    var user_id=req.params.user_id;
    try{
        var exist=await Apply.findAll({
            where:{user_id:user_id,
                    task_id:task_id}
        });
        //console.log(exist);
        if(exist==""){
            var count=await Apply.max('apply_id');
            var task_name=await Task.findOne({
                where:{task_id:task_id}
            })
            //console.log(count);
            count=count+1;
            await Apply.create({
                apply_id:count,
                user_id:user_id,
                task_id:task_id,
                task_name:task_name.task_name,
                is_approved:null,
            });
            res.send(`<script type="text/javascript">alert("참여신청하셨습니다! 관리자의 승인을 기다리세요!");history.back();</script>`);
        }
        else{
            res.send(`<script type="text/javascript">alert("이미 참여신청하셨습니다!");history.back();</script>`);
        }
        
        
    }
    catch(err){
        console.log(err);
        res.send(`<script type="text/javascript">alert(" 에러! 뒤로돌아갑니다.");history.back();</script>`);
    }
})

/* 1팀: 제출자 페이지 라우터 추가 */
router.get('/partic',isLoggedIn,async(req,res,next)=>{
    var tasks=await Task.findAll({
        include:[
            {
                model:Apply,
                required:false,
                attributes:['user_id','is_approved']
            },{
                model:ODT,
                required:false,
                attributes:['name']
            }
        ]
    });
    res.render('partic_main',{tasks});
})

/* 1팀: 파일제출 현황 라우터 */
router.get('/partic/partic/:id',isLoggedIn,async(req,res,next)=>{
    var pdfs=await pdf.findAndCountAll({
        include:[
            {
                model:Task,
                required:false,
                attributes:['task_name']
            }

        ],
        where:{submitter_id:req.params.id}
    });

    var tasks=await Task.findAll({
        include:[
            {
                model:pdf,
                required:false,
                attributes:['num_total_tuples'],
                where:{rater_id:req.params.id}
            }
        ]
    })

    var pass_files=await pdf.findAndCountAll({
        where:{submitter_id:req.params.id,
                is_passed:'P'}
    });
    var task_count=pdfs.count;
    var total_tuples=0;
    for(var i=0;i<pass_files;i++){
        total_tuples+=pass_files.rows[i].num_total_tuples;
    }
    console.log(total_tuples);
    
    res.render('partic_partic',{tasks,pdfs,task_count,pass_files,total_tuples});
})
/* 1팀: 제출자 파일 제출 라우터 */
router.post('/upload',upload.single('csv_file'),async(req,res,next)=>{
    try{
        var filename=req.file.filename;
        const csv=fs.readFileSync('uploads/'+filename);
        const records=parse(csv.toString('utf-8'));
        console.log(records.length); //튜플수
        var num_total_tuples=records.length;
        //중복튜플
        var count_duplicate_tuple=0;
        for(var i=0;i<records.length;i++){
            for(var j=i+1;j<records.length;j++){
                if(records[i]==records[j]){
                    count_duplicate_tuple++;
                }
            }
        }
        //null비율
        var count_null=0;
        for(var i=0;i<records.length;i++){
            for(var j=0;j<records[i].length;j++){
                console.log(records[i]);
                console.log(records[i][j]);
                if(records[i][j]==''){
                    console.log(count_null);
                    count_null++;
                }
            }
        }

        //렌덤으로 평가자 찾기
        var rater=await User.findOne({
            order:sequelize.random('username'),
            where:{role:2}
        })
        //pars테이블로 저장
        console.log(count_null);
        var null_ratio=count_null/(num_total_tuples*records[0].length);

        var pars_id=await pdf.max('pars_id')+1;
        var files=await pdf.create({
            pars_id:pars_id,
            duration_start:req.body.start_date,
            duration_end:req.body.end_date,
            iteration:req.body.time,
            submitted_task_id:req.body.task_id,
            rater_id:rater.id,
            is_evaluated:null,
            num_total_tuples:num_total_tuples,
            num_duplicate_tuples:count_duplicate_tuple,
            null_ratio:null_ratio,
            quelity_score:null,
            is_passed:null,
            csv_file_name:req.file.filename,
            csv_file_size:req.file.size,
            csv_file_updated_at:Date(),
            submitter_id:req.body.submitter_id,
            odt:req.body.odt,
        });
        res.send(`<script type="text/javascript">alert("제출성공하셨습니다!");history.back();</script>`)
    }catch(err){
        console.error(err);
        res.send(`<script type="text/javascript">alert(" 에러! 뒤로돌아갑니다.");history.back();</script>`);
}

})

module.exports=router;