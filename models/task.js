const Sequelize=require('sequelize');

module.exports=class Task extends Sequelize.Model{
    static init(sequelize){
        return super.init({
            task_id:{
                type: Sequelize.INTEGER,
                allowNull:true,
                unique:true,
                primaryKey:true,
            },
            task_name:{
                type:Sequelize.STRING(255),
                allowNull:false,
            },
            description:{
                type:Sequelize.STRING(255),
                allowNull:true,
            },
            task_table_name:{
                type:Sequelize.STRING(255),
                allowNull:false,
            },
            min_upload_freq:{
                type:Sequelize.INTEGER,
                allowNull:true,
            },
            is_closed:{
                type:Sequelize.BOOLEAN,
                defaultValue:false,
            },
            table_schema:{
                type:Sequelize.STRING(255),
                allowNull:false,
            }
        },{
            sequelize,
            timestamps:false,
            underscored:false,
            modelName:'Task',
            tableName:'task',
            paranoid:false,
            charset:'utf8',
            collate:'utf8_general_ci', 
        });
    }
    static associate(db){
        db.Task.belongsTo(db.User,{
            foreignKey:'task_id',
            targetKey:'id'
        });
        db.Task.hasMany(db.ODT,{
            foreignKey:'t_id',
            sourceKey:'task_id'
        });
        db.Task.hasMany(db.Apply,{
            foreignKey:'task_id',
            sourceKey:'task_id'
        })
    }
}