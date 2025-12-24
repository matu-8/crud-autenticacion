import { Sequelize } from "sequelize";
import 'dotenv/config'

export const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USERNAME,
    process.env.DB_PASSWORD,
    {
   host:process.env.DB_HOST,
   dialect:process.env.DB_DIALECT
});

//conexion a postgres

export const connectPg = async()=>{
    try {
  await sequelize.authenticate();
  console.log('>>> Conexion establecida con exito');
  await sequelize.sync();
  console.log('>>> Sincronizacion exitosa')
} catch (error) {
  console.error(`>>> Ha ocurrido un error en la conexion: ${error}`);
}
}