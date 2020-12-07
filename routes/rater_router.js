const express=require('express');
const { isLoggedIn,isNotLoggedIn } = require('./middlewares');
console.log(isLoggedIn);
const Task=require('../models/task');
const ODT=require('../models/original_data_type');
const Apply=require('../models/apply');
const User=require('../models/user');
const pdf=require('../models/pars_data_seq_file');
//const Pars = require('..models/pars_data_seq_file');
var mysql = require('mysql2');
var database=require('../config/config.json');
var multer=require('multer');
var upload=multer({dest:'uploads/'});
var fs=require('fs');
const { QueryTypes } = require('sequelize');


var con = mysql.createConnection(database.db);

const router=express.Router();

//제출된 태스크 평가 페이지
router.get('/manage/:rater_id',isLoggedIn,async(req,res)=>{
    let id = req.params.rater_id;

    con.connect(function(err) {
        if (err) throw err;
        var sql = `SELECT task_name, pars_id, submitter_id, name, username, csv_file_name, is_evaluated, num_duplicate_tuples, num_total_tuples, null_ratio FROM pars_data_seq_file AS p INNER JOIN task AS t ON t.task_id = p.submitted_task_id INNER JOIN users AS u ON u.id = p.submitter_id INNER JOIN original_data_type AS o ON o.t_id = t.task_id WHERE rater_id = '` + id + `'AND is_closed = 'false' AND is_evaluated IS NULL`;
        con.promise()
            .query(sql, {type:QueryTypes.SELECT})
                .then(pars_data_files => {
                    console.log(pars_data_files[1]);
                    res.render('rater_profile', 
                    {pars_data:pars_data_files})
                })
                .catch(err => console.log(err))
    });
});

//평가내역 모니터링
router.get('/overview/:rater_id',isLoggedIn,async(req,res)=>{
    let id = req.params.rater_id;
    console.log(id)
    con.connect(function(err) {
        if (err) throw err;
        var sql = `SELECT task_name, username, submitter_id, is_passed, quality_score FROM pars_data_seq_file AS p INNER JOIN users AS u ON u.id = p.submitter_id INNER JOIN task AS t ON t.task_id = p.submitted_task_id WHERE is_evaluated is not null AND rater_id = '` + id + `'`;
        
        var sql_num_submitters = `SELECT COUNT(DISTINCT submitter_id) AS num FROM pars_data_seq_file WHERE is_evaluated is not null AND rater_id = '` + id + `'`;
        var sql_num_seq_file = `SELECT COUNT(DISTINCT pars_id) AS num_seq_file FROM pars_data_seq_file WHERE is_evaluated is not null AND rater_id = '` + id + `'`;
        var sql_avg_score = `SELECT AVG(quality_score) AS score FROM pars_data_seq_file WHERE is_evaluated is not null AND rater_id = '` + id + `'`;
        //var sql_num_seq_file = `SELECT COUNT(DISTINCT pars_id) AS num_seq_file FROM pars_data_seq_file`;
        con.promise().query(sql, {type:QueryTypes.SELECT})
                .then(tasks => {
                    con.promise().query(sql_num_submitters, {type:QueryTypes.SELECT})
                        .then(submitters => {
                            con.promise().query(sql_num_seq_file, {type:QueryTypes.SELECT})
                            .then(seq_files => {
                                con.promise().query(sql_avg_score, {type:QueryTypes.SELECT})
                                .then(score_val => {
                                    console.log(score_val)
                                    res.render('rater_index', 
                                    {evaluated_tasks:tasks, 
                                    evaluated_submitters:submitters, 
                                    evaluated_files:seq_files,
                                    score:score_val
                                    })
                                })
                                
                            })
                            .catch(err => console.log(err))
                        })       
                    });
        });
});

//file다운로드 시 사용되는 라우터 (파일명으로 다운로드)
router.get('/download/:fileid',isLoggedIn,(req,res)=>{
    try{
        const fileid=String(req.params.fileid);
        console.log(fileid);
        const file = './uploads/'+fileid;
        console.log(file);
        fs.statSync(file);
        res.download(String(file)); 
    }catch(err){
        if(err.code==='ENOENT'){
            res.render('404');
        }
    }
    
})

//제출된 태스크에 대한 평가를 데이터베이스에 저장
router.post('/save', isLoggedIn, async(req, res) => {

    let pars_id = req.body.pars_id;
    var errors = []
    console.log(pars_id);
    //if (pars_id)
    let quality_score=req.body.quality_score;
    let pass_or_fail = req.body.pass_or_fail;
    console.log(quality_score,pass_or_fail);
    await pdf.update({
        is_evaluated:true,
        is_passed: pass_or_fail,
        quality_score: quality_score
    },{
        where:{
            pars_id:pars_id}
    })
    .then(result=>{
        console.log("평가 등록 성공!");
        console.log(quality_score);
        res.send(`<script type="text/javascript">alert("평가가 완료되었습니다!");history.back();</script>`);
        res.redirect('/manage/:rater_id')
    })
    .catch(err=>{
        console.log("평가 등록 실패!")
        console.log(err);
        res.send(`<script type="text/javascript">alert("평가 등록에 실패했습니다!");history.back();</script>`);
    });
});


module.exports=router;