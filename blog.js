//Requirements & Initializations
var express = require('express');
var app = express();
var path = require('path');
var bodyParser = require('body-parser');
var promise = require('promise');
var Sequelize = require('sequelize');
var sassMiddleware = require('node-sass-middleware');

var http = require("http");
var https = require("https"); //needed for making the api requests. 


app.set('views', path.join(__dirname, 'views')); //set the views folder where the jade file resides
app.set('view engine', 'jade'); //sets the jade rendering

app.use(bodyParser.urlencoded({
	extended: true
})); // for parsing form data. 

app.use(sassMiddleware({
    /* Options */
    src: path.join(__dirname,'sass'),
    dest: path.join(__dirname),
    debug: true,
    outputStyle: 'compressed',
    prefix:  '/prefix'  // Where prefix is at <link rel="stylesheets" href="prefix/style.css"/>
}));

app.use(express.static( path.join( __dirname)));

app.listen(3000);



//Database
var pg = require('pg')
var connectionString = 'postgres://' + 'roberto' + ':' + 'roberto001' + '@localhost/blog'; //credentials for the database.
var sequelize = new Sequelize(connectionString)


//Encryption
var bcrypt = require('bcrypt');

//Sequelize models 
var User = sequelize.define('user', { //define the model, in this case represnenting the user table. 
	id: {
		type: Sequelize.INTEGER,
		autoIncrement: true,
		unique: true,
		
	}, //each line reflects a column of the table, this is a primary key.
	username: {
		type: Sequelize.STRING,
		allowNull: false,
		unique: true,
		primaryKey: true
	}, // additional constraints such as uniqueness can be added.
	password: {
		type: Sequelize.STRING,
		allowNull: false
	},
	email: {
		type: Sequelize.STRING,
		unique: true
	},
	telephone: {
		type: Sequelize.STRING,
		allowNull: false
	},
	secret: {
		type: Sequelize.STRING
	},
	val: {
		type: Sequelize.BOOLEAN
	}
})

var Post = sequelize.define('post', {
	id: {
		type: Sequelize.INTEGER,
		autoIncrement: true,
		primaryKey: true
	},
	title: {
		type: Sequelize.STRING,
		allowNull: false
	},
	body: {
		type: Sequelize.STRING,
		allowNull: false
	},
	author: {
		type: Sequelize.STRING,
		references: {
			model: User,
			key: 'username',
			deferrable: Sequelize.Deferrable.INITIALLY_IMMEDIATE
		}
	}
})

var Comment = sequelize.define('comment', {
	id: {
		type: Sequelize.INTEGER,
		autoIncrement: true,
		primaryKey: true
	},
	content: {
		type: Sequelize.STRING,
		allowNull: false,
	}/*,
	commenter: {
		type: Sequelize.STRING,
		allowNull: false,
		
	}*/
})

Post.hasMany(Comment);
Comment.belongsTo(Post);
Comment.belongsTo(User);
sequelize.sync({force:true});

//apply these database models to the database

//COOKIES & SESSIONS 
var session = require('client-sessions');

app.use(session({ //app.use adds session to the middleware stack.
	cookieName: 'session',
	secret: 's123y721hufsdh2342334uhjsfdhjfhu34ru',
	duration: 30 * 60 * 1000,
	activeDuration: 30 * 60 * 1000,
}));

//global middleware function for maintaining sessions between pages.
//Checks for sessions every request.
app.use(function(req, res, next) {
	if (req.session && req.session.user) { //if session exists and the session.user exists (this can only be from the login post request)
		User.findOne({ //find the username 
			where: {
				username: req.session.user.username
			}
		}).then(function(user) {
			if (user) { //if the user exists 
				req.user = user; //assign all the dataValues of user to req.user 
				delete req.user.password; //delete password from the user object
				req.session.user = user; //reset the session with new values of user. 
				res.locals.user = user; //store in local variable for next route to make use of.
				next(); //run whatever route is due to take place.
			}
		});
	} else {
		next(); //same as above. 
	}
});

//log-in function
function requireLogin(req, res, next) {
	if (!req.user) { //checks if the user is logged in.
		res.redirect('/login');
	} else {
		next();
	}
};



//GET routes 
app.get('/logout', function(req, res) { // Get the login page after logging out . 
	req.session.reset();
	res.redirect('/login');
});

app.get('/', function(req, res) { // Get the login page. 
	res.render('login');
});

app.get('/register', function(req, res) { //Get the register page.
	res.render('register');
});

app.get('/users', function(req, res) { //returns a list of all the users 
	User.findAll().then(function(users) { //find all the users
		var data = users.map(function(user) { //map applies a function to each element within the users array. 
			return {
				username: user.dataValues.username //this function returns only the usernames from the table, within an array. 
			};
		});
		res.render('users', {
				userlist: data
			}) //send the users object and render the page. 
	});
});

app.get('/users/:username', function(req, res) { //Dynamic route to view each user that exists. 
	User.findOne({
		where: {
			username: req.params.username
		}
	}).then(function(user) { //this takes the value of whatever is :username
		if (!user) { //if user does not exist
			res.status(404).send('Sorry that user does not appear to exist!');
		} else {
			var data = user
			res.render('user', {
				userdata: data
			})
		}
	});
});

app.get('/newpost', function(req, res) { // Go to the new post form page . 
	res.render('newpost');
});


/*app.get('/dashboard', function(req,res) {
	if (req.session && req.session.user) { // Check if session exists at all.
    // find the user by pulling their username from the session.
    User.findOne({where: {username: req.session.user.username} }).then(function (err, user) {
      if (!user) {
        // if the user isn't found in postgres, 
        //reset the session info.
        req.session.reset();
        res.redirect('/login');
      } 
    else {
        res.locals.user = user; // adds user details to response sent to dashboard page for further use.
        res.render('dashboard'); // the users object is now available within dashboard for manipulation via jade.
      }
  });
}
  	else {
    	res.redirect('/login');
  		}	
});
*/


app.get('/dashboard', requireLogin, function(req, res) {
	res.render('dashboard');
});

app.get('/myposts', function(req, res) { //find all the posts of the user logged in 
	Post.findAll({
		where: {
			author: req.session.user.username
		}
	}).then(function(posts) {
		var data = posts.map(function(post) { //map applies a function to each element within the users array. 
			return {
				title: post.dataValues.title,
				body: post.dataValues.body,
				id: post.dataValues.id
					//this function returns all the post stuff from the table, within an array, minus the ID and username which isn't necessary. 
			};
		});
		res.render('myposts', {
				postlist: data
			}) //send the posts object and render the page. 
	});
});

app.get('/posts', function(req, res) {
	Post.findAll().then(function(posts) { //find all the posts
		var data = posts.map(function(post) { //map applies a function to each element within the posts array. 
			return { //create an object array with the following values 
				title: post.dataValues.title,
				body: post.dataValues.body,
				author: post.dataValues.author,
				id: post.dataValues.id
			};
		});
		res.render('posts', {
				postlist: data
			}) //send the posts object and render the page. 
	});
});

app.get('/users/:username/posts', function(req, res) { //Dynamic route to view a list of posts for  each user that exists. 
	Post.findAll({
		where: {
			author: req.params.username
		}
	}).then(function(posts) { //this takes the value of whatever is :username
		if (!posts) { //if posts do not exist
			res.status(404).send('Sorry this user does not appear to have posted before!'); //
		} else {
			var data = posts;
			var author = req.params.username
			res.render('postlist', {postlist: data,author:author})
		};

	});

});


app.get('/users/:username/posts/:id', function(req, res) { //Dynamic route to view each individual post with comments 
	var posts = undefined;
	var comments = undefined;

	Post.findAll({
		where: {
			author: req.params.username, //search the database for username
			id: req.params.id //search the database for post id 
		}
		}).then(function(posts) { //perform this function on results of previous query 
			var data = posts.map(function(post) { //apply another function to each element of posts array. 
				return {
					title: post.dataValues.title, //values can be accessed by data.title instead of posts.datavalues.title as previously. 
					body: post.dataValues.body,
					author: post.dataValues.author,
					id: post.dataValues.id
				}	
			})
			posts = data // //rename data val just created to "posts"
		
		Comment.findAll({ //find all the comments now
				where: { 
				postId: req.params.id //where foreign key postid matches 
			}
		})
		.then(function(comments) {
			var data = comments.map(function(comment){
				return {
					content: comment.dataValues.content, //we just need the content of the comment and the person who wrote the comment.
					user: comment.dataValues.userUsername
				}
				
			});
			comments = data; //assign new variable for comments
			id = req.params.id; // id refers to the post id, needs to be used in post form when user writes a comment. 
			urlAuthor = req.params.username //same as above but refers to author of the post, needs to used when a different user writes a comment. 
			res.render('post', {posting: posts, commenting:comments,postid:id,author:urlAuthor}) //render post, and pass values. 
			
		});
		});	
		});



//POST routes
app.post('/login', function(req, res) { // Send and check the login details against the server.
	User.findOne({
		where: {
			username: req.body.username
		}
	}).then(function(user) { //find a user which matches the username from the form
		if (!user) { //if no user exists
			res.render('login', {
				error: "Invalid username or password"
			});
			console.log("no user")
		} else {
			bcrypt.compare(req.body.password, user.password, function(err, result) { //compares entered password with hash applied, against database password.
			if (result === true && user.val === true) { //otherwise if user exists and the password matches 
				req.session.user = user; //set cookie as user object. This contains every row of that specific user. email,password,username.
				console.log("here we go")
				res.redirect('/dashboard')
			}

			if (result === true && user.val === false) {
			 	req.session.id = user.username; //stores the username temporarily in the session file. 
			 	res.render('val');
			 }

			else {
				res.render('login', {
					error: "Invalid username or password"
				});
				console.log("something different went wrong")
			}
		});
};
});

});

app.post('/users', function(req, res) { //Creating a new user.
	var password = req.body.password //declare new password variable from form data
	var deets = []; // 


	bcrypt.hash(password, 8, function(err, hash) { //magical encryption. This turns the password into a "password+salt gone through hash function" string.
	User.create({
		username: req.body.username, //create new user based on form data.
		password: hash, //use the hash here from previous function to make the password hardcore. 
		email: req.body.email,
		telephone: req.body.telephone,
		secret: "none",
		val: false


	}).then(function() { 
			User.findOne({ 
				where: {
					username: req.body.username
					} //look up said user we just made.


					}).then(function(user){
						var telephone = user.telephone;
						console.log("userphone="+ user.telephone) //take out telephone value for later use
						var deets = [user.telephone,user.username];

						https.get('https://api02.highside.net/start/SJkKzuTE?number='+ deets[0], (res) => {
  							console.log('statusCode: ', res.statusCode); //let's see if our get request worked
  							console.log('headers: ', res.headers); //more request info.

  							res.setEncoding('utf8'); //we don't want horrible binary buffer, so set this to something readable.

  						res.on('data', (d) => { //this is the data/our code. 
    						console.log(d); //print it out to take a look. 
    						var geheim = d; // lets call it something else. 

								User.update({secret: geheim} //update the db with our 2fa code. 
								,{where: {username: deets[1]}}
								)});
  								

						}).on('error', (e) => {
  							console.error(e);
  							//if there is an error with our request print it out.
						
						});

				}).then(function() {

				res.render('login', {
				success: "The registration was succesful, please log-in!"
				}); //returns to the log-in page with success message.
			
		}, function(error) { //upon error do the following:
			res.render('register', {
				matching: "It appears someone has already taken this username, please try something else!"
			});
			//error is only likely to occur from repeating the same username, display error and return to same page.
		
	})

	});
});
});


app.post('/val', function(req, res) {
	User.findOne({
		username: req.session.id //find the user.
	}).then(function(user) {
			if (req.body.code == user.secret) {
				User.update({val: true},
					{where: {username:user.username}})
				req.session.user = user;
				res.redirect('/dashboard')
			}
			else  { //upon error do the following:
			res.render('login', {
				error: "Seems like you entered your code incorrectly, log in and try again."
			});
			//error is only likely to occur from repeating the same username, display error and return to same page.
		};
	});
});






app.post('/post', function(req, res) {
	Post.create({
		title: req.body.title, //create new post based on form data.
		body: req.body.body,
		author: req.session.user.username
	}).then(function() {
			res.redirect('/myposts');
			//returns to the log-in page with success message.
		}, function(error) { //upon error do the following:
			res.render('newpost', {
				error: "Something went wrong, please try again later"
			});
			//error is only likely to occur from repeating the same username, display error and return to same page.
		}

	);
});

app.post('/comment', function(req, res) { // create new comment 
	Comment.create({
		content: req.body.body, //this is the comment contents 
		postId: req.body.id, //this is the blog post id 
		userUsername: req.session.user.username, //takes username from session data for comment author. Also foreign key on user table. 
	}).then(function() {
			res.redirect('/users/'+req.body.author+'/posts/'+req.body.id); //redirect to page
			//returns to the post page where comment was made. 
		})		
});