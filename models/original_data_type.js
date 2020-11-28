const Sequelize=require('sequelize');

module.exports=class ODT extends Sequelize.Model{
    static init(sequelize){
        return super.init({
            t_id:{
                type:Sequelize.INTEGER,
                allowNull:false,
                foreignKey:true,
            },
            name:{
                type:Sequelize.STRING(255),
                allowNull:false,
                primaryKey:true,
            },
            schema_info:{
                type:Sequelize.STRING(255),
                allowNull:true,
            },
            mapping_info:{
                type:Sequelize.STRING(255),
                allowNull:false,
            }
        },{
            sequelize,
            timestamps:false,
            underscored:false,
            modelName:'ODT',
            tableName:'original_data_type',
            paranoid:false,
            charset:'utf8',
            collate:'utf8_general_ci',
        });  
    }
    static associate(db){
        db.ODT.belongsTo(db.Task,{
            foreignKey:'t_id',
            targetKey:'task_id'
        })
    }
}