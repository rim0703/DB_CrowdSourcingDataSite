const Sequelize=require('sequelize');

module.exports=class Apply extends Sequelize.Model{
    static init(sequelize){
        return super.init({
            apply_id:{
                type:Sequelize.INTEGER,
                allowNull:false,
                unique:true,
                primaryKey:true,
            },
            user_id:{
                type:Sequelize.STRING(255),
                allowNull:false,
            },
            task_id:{
                type:Sequelize.INTEGER,
                allowNull:false,
            },
            task_name:{
                type:Sequelize.STRING(255),
                allowNull:false,
            },
            is_approved:{
                type:Sequelize.BOOLEAN,
                allowNull:true,
            }
        },{
            sequelize,
            timestamps:false,
            underscored:false,
            modelName:'Apply',
            tableName:'apply',
            paranoid:false,
            charset:'utf8',
            collate:'utf8_general_ci',
        });
    }
    static associate(db){
        db.Apply.belongsTo(db.User,{
            foreignKey:'user_id',
            targetKey:'id'
        })
        db.Apply.belongsTo(db.Task,{
            foreignKey:'task_id',
            targetKey:'task_id',
        })
    }
}