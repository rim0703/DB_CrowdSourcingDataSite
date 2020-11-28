const Sequelize=require('sequelize');

module.exports=class ODF extends Sequelize.Model{
    static init(sequelize){
        return super.init({
            submitter_id:{
                type:Sequelize.STRING(20),
                allowNull:false,
            },
            odf_ID:{
                type:Sequelize.INTEGER,
                allowNull:false,
                unique:true,
                primaryKer:true,
            }
        },{
            sequelize,
            timestamps:false,
            underscored:false,
            modelName:'ODF',
            tableName:'original_data_files',
            paranoid:false,
            charset:'utf8',
            collate:'utf8_general_ci', 
        });
    }
    static associate(db){
        db.ODF.belongsTo(db.User,{
            foreginKey:'submitter_id',
            targetKey:'id'
        });
        
    }
}