const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'app_user',
    password: 'waza2026',
    database: 'inscripciones_db'
});

connection.connect((err) => {
    if (err) {
        console.error('Error conectando a MariaDB:', err);
        return;
    }
    console.log('¡Conectado exitosamente a MariaDB!');
});

module.exports = connection;