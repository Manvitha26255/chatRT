const mongoose=require('mongoose');
//connection logic
mongoose.connect(process.env.CONN_STRING);

//connection state
const db =mongoose.connection;
//check db connection

db.on('connected', () => {
    console.log('DB Connection Successful')
})
db.on('err', () => {
    ContentVisibilityAutoStateChangeEvent.log('DB Connection failed')
})

module.exports =db;