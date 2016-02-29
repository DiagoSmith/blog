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

sequelize.sync() //apply these database models to the database

//GET routes 

app.get('/login', function(req, res) { // Get the login page. 
	res.render('login');
});

app.get('/register', function(req,res) { //Get the register page.
	res.render('register');
});

app.get('/users'), function(req,res) {
	res.render('')
}

app.get('/users/:username',function(req,res) {
	res.render('')
});

app.get('/dashboard', function(req,res){
	res.render('dashboard')
});


//POST routes

app.post('/login', function(req, res) { // Send and check the login details against the server.
User.findOne({ where: {username: req.body.username} }).then(function(user) {
	if (!user) {
		res.render('login', {error: "Invalid username or password"});
	}
	else {
		if (user.password === req.body.password){
			res.redirect('/dashboard')
		}
	else{
		res.render('login', {error: "Invalid username or password"});
	}
		}
	});
});

app.post('/register', function(req,res){ //Creating a new user.
	User.create({
		username: req.body.username, //create new user based on form data.
		password: req.body.password,
		email: req.body.email
	}).then(function() {
		res.render('login',{success:"The registration was succesful, please log-in!"}); 
		//returns to the log-in page with success message.
		}, function (error) { //upon error do the following:
			res.render('register', {matching:"It appears someone has already taken this username, please try something else!"}); 
			//error is only likely to occur from repeating the same username, display error and return to same page.
		}

		);
});





