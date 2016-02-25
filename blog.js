//Requirements & Initializations
var express = require('express');
var app = express();
var path = require('path');
var bodyParser = require('body-parser');
var promise = require('promise');
var Sequelize = require('sequelize');


app.set('views', path.join(__dirname, 'views')); //set the views folder where the jade file resides
app.set('view engine', 'jade'); //sets the jade rendering

app.use(bodyParser.urlencoded({ extended: true })); // for parsing form data. 

app.listen(3000);

//Database
var pg = require('pg')
var connectionString = 'postgres://' + process.env.POSTGRES_USER + ':' + process.env.POSTGRES_PASSWORD + '@localhost/blog'; //credentials for the database.
var sequelize = new Sequelize(connectionString)

//Sequelize models 
var User = sequelize.define('user', { //define the model, in this case represnenting the user table. 
  id: {type: Sequelize.INTEGER,autoIncrement: true, primaryKey: true}, //each line reflects a column of the table, this is a primary key.
  username: {type: Sequelize.STRING, allowNull: false, unique: true}, // additional constraints such as uniqueness can be added.
  password: {type: Sequelize.STRING, allowNull: false},
  email: {type: Sequelize.STRING, unique: true}
})

var Post = sequelize.define('post', {
  id: {type: Sequelize.INTEGER,autoIncrement: true, primaryKey: true},
  title: {type: Sequelize.STRING, allowNull: false},
  body: {type: Sequelize.STRING, allowNull: false},
  author: {type: Sequelize.STRING, references: {
  	model: User, key: 'username', deferrable: Sequelize.Deferrable.INITIALLY_IMMEDIATE
  	}
  }
})

var Comment = sequelize.define('comment', {
  id: {type: Sequelize.INTEGER,autoIncrement: true, primaryKey: true},
  body: {type: Sequelize.STRING, allowNull: false,},
  parentblog: {type: Sequelize.INTEGER, references: {
  	model: Post, key: 'id', deferrable: Sequelize.Deferrable.INITIALLY_IMMEDIATE}},
  author: {type: Sequelize.STRING, references: {
  model: User, key: 'username', deferrable: Sequelize.Deferrable.INITIALLY_IMMEDIATE
  }
	}
})

sequelize.sync()

 //apply these database models to the database

//routes 




