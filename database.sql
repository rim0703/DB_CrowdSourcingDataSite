CREATE DATABASE IF NOT EXISTS db;
USE db;

/* 숫자형INTEGER형에서 길이를 제한할 경우 경고메세지 뜸 */
/* 해결: 숫자형에 대해서 길이제한을 삭제 */
CREATE TABLE IF NOT EXISTS users (
	id VARCHAR(20) NOT NULL UNIQUE,
    password VARCHAR(20) NOT NULL,
    email VARCHAR(255) DEFAULT "" NOT NULL,
    username VARCHAR(255) NOT NULL,
    sex VARCHAR(255) NOT NULL,
    age INTEGER,
    date_of_birth DATE,
    address VARCHAR(255),
    cellphone VARCHAR(255),
	/*role=0:관리자 role=1:제출자 role=2:평가자*/
    role INTEGER NOT NULL,
	score INTEGER DEFAULT 0 NOT NULL,
    created_at DATE NOT NULL,
	
	/*key*/
	CONSTRAINT USER_ID_PK
		PRIMARY KEY (id),
	
	/*check*/
	CONSTRAINT SEX_CONSTRAINT
		CHECK (sex="남자" OR sex="여자"),
	CONSTRAINT AGE_CONSTRAINT
		CHECK (age>=0),
	CONSTRAINT ROLE_CONSTRAINT
		CHECK (role=1 OR role=2 OR role=0),
	CONSTRAINT SCORE_CONSTRAINT
		CHECK (score>=0)
    );

/* 관리자 계정 생성 */
INSERT INTO users(id,password,email,username,sex,role,score,created_at)
VALUES ('admin','admin','admin@admin.com','관리자','남자',0,0,STR_TO_DATE('2020-11-01','%Y-%m-%d'));

/* ERD에서 task부분에 participate_id를 is_closed로 바뀜 */
/* 참여자의 id는 해당 파싱파일 table에 저장됨 */
CREATE TABLE IF NOT EXISTS task(
	task_id INTEGER NOT NULL UNIQUE,
	task_name VARCHAR(255) NOT NULL,
	description VARCHAR(255),
	task_table_name VARCHAR(255) NOT NULL,
	min_upload_freq INTEGER,
	is_closed BOOLEAN DEFAULT (FALSE),
	table_schema VARCHAR(255) NOT NULL,
	/*key*/
	CONSTRAINT TASK_ID_PK
		PRIMARY KEY (task_id),
	/*check*/
	CONSTRAINT TASK_INFO_CONSTRAINT
		CHECK(task_id>=0),
		CHECK(min_upload_freq>=1)
);

CREATE TABLE IF NOT EXISTS pars_data_seq_file(
	/* Information */
	pars_id INTEGER NOT NULL,
    duration_start DATE NOT NULL,
    duration_end DATE NOT NULL,
    iteration INTEGER NOT NULL,
    submitted_task_id INTEGER NOT NULL,
    rater_id VARCHAR(20),
    is_evaluated BOOLEAN DEFAULT FALSE,
    
    /* Quantitative evaluation */
    num_total_tuples INTEGER,
    num_duplicate_tuples INTEGER,
    null_ratio REAL,
    
    /* Qualitative evaluation */
    quality_score INTEGER,
    is_passed VARCHAR(2),

	csv_file_name varchar(255) NOT NULL,
  	csv_file_size int NOT NULL,
  	csv_file_updated_at date NOT NULL,
  	submitter_id varchar(20) NOT NULL,
	odt varchar(255) NOT NULL,
    
    /* Keys */
    CONSTRAINT PARS_PK
		PRIMARY KEY (pars_id),
    
	CONSTRAINT PARS_SUBMITTER_FK
		FOREIGN KEY (submitter_id)
			REFERENCES users (id)
			ON DELETE CASCADE
			ON UPDATE CASCADE,

    CONSTRAINT PARS_TASK_FK
		FOREIGN KEY (submitted_task_id)
			REFERENCES task (task_id)
			ON DELETE CASCADE
			ON UPDATE CASCADE,
            
    CONSTRAINT PARS_RATER_FK        
		FOREIGN KEY (rater_id)
			REFERENCES users (id)
			ON DELETE CASCADE
			ON UPDATE CASCADE,
    
    /* Checks */
    CONSTRAINT PARS_ID_CONSTRAINT
		CHECK (pars_id >= 0),
        
	CONSTRAINT PARS_DURATION_CONSTRAINT
		CHECK (duration_end >= duration_start),
	
    CONSTRAINT PARS_ITERATION_CONSTRAINT
		CHECK (iteration >= 1),
	
    CONSTRAINT PARS_QUANTI_CONSTRAINT
		CHECK (num_total_tuples >= 0),
		CHECK (num_duplicate_tuples >= 0),
		CHECK (null_ratio >= 0),
	
    CONSTRAINT PARS_QUALITY_CONSTRAINT
		CHECK (quality_score >= 0 AND quality_score <= 10),
	
    CONSTRAINT PARS_P_NP_CONSTRAINT
		CHECK (is_passed = "P" OR is_passed = "NP")
);

CREATE TABLE IF NOT EXISTS original_data_type(
	t_id INTEGER NOT NULL,
	name VARCHAR(255) NOT NULL,
	schema_info VARCHAR(255),
	mapping_info VARCHAR(255) NOT NULL,
	
	/*key*/
	CONSTRAINT ODT_NAME_PK
		PRIMARY KEY (name),
	CONSTRAINT TASK_ID_FK
		FOREIGN KEY (t_id)
			REFERENCES task (task_id)
			ON DELETE CASCADE
			ON UPDATE CASCADE
);

/*새로추가된 테이블 -> 사용자로부터 참가신청+참여허가를 구현하기 위한 테이블*/
CREATE TABLE IF NOT EXISTS apply(
	apply_id INTEGER NOT NULL PRIMARY KEY,
	user_id VARCHAR(255) NOT NULL,
    task_id INTEGER NOT NULL,
    task_name VARCHAR(255) NOT NULL,
    is_approved BOOLEAN DEFAULT NULL
);
