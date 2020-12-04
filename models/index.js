const Sequelize = require('sequelize');

const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const User=require('./user');
const Task=require('./task');
const ODT=require('./original_data_type');
const Apply=require('./apply');
const pdf=require('./pars_data_seq_file');

const db = {};
const sequelize=new Sequelize(config.database,config.username, config.password,config);

db.sequelize = sequelize;

db.User=User;
db.Task=Task;
db.ODT=ODT;
db.Apply=Apply;
db.pdf=pdf;

User.init(sequelize);
Task.init(sequelize);
ODT.init(sequelize);
Apply.init(sequelize);
pdf.init(sequelize);

User.associate(db);
Task.associate(db);
ODT.associate(db);
Apply.associate(db);
pdf.associate(db);

module.exports = db;
