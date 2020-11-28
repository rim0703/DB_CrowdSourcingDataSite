const Sequelize=require('sequelize');

module.exports=class User extends Sequelize.Model{
    static init(sequelize){
        return super.init({
            id:{
                type: Sequelize.STRING(255),
                allowNull:false,
                unique:true,
                primaryKey:true,
                
            },
            password:{
                type: Sequelize.STRING(20),
                allowNull:false,
            },
            email:{
                type: Sequelize.STRING(255),
                allowNull:false,
                defaultValue:"",
            },
            username:{
                type:Sequelize.STRING(255),
                allowNull:false,
            },
            sex:{
                type:Sequelize.STRING(255),
                allowNull:false,
            },
            age:{
                type:Sequelize.INTEGER,
                allowNull:true,
                defaultValue:0,
            },
            date_of_birth:{
                type:Sequelize.DATE,
                allowNull:true,
            },
            address:{
                type:Sequelize.STRING(255),
                allowNull:true,
            },
            cellphone:{
                type:Sequelize.STRING(255),
                allowNull:true,
            },
            role:{
                type:Sequelize.INTEGER,
                allowNull:false,
            },
            score:{
                type:Sequelize.INTEGER,
                allowNull:false,
                defaultValue:0,
            },
            created_at:{
                type:Sequelize.DATE,
                allowNull:false,
            },
        },{
            sequelize,
            timestamps:false,
            underscored:false,
            modelName:'User',
            tableName:'users',
            paranoid:false,
            charset:'utf8',
            collate:'utf8_general_ci',
        });
    }
    static associate(db){
        //db.User.hasMany(db.ODF,{
        //    foreignKey:'submitter_id',
        //    sourceKey:'id'
        //});
        db.User.hasMany(db.Task,{
            foreignKey:'task_id',
            sourceKey:'id'
        });
        db.User.hasMany(db.Apply,{
            foreignKey:'user_id',
            sourceKey:'id'
        })
        
    }
};