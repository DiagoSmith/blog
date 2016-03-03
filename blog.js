//Requirements & Initializations
var express = require('express');
var app = express();
var path = require('path');
var bodyParser = require('body-parser');
var promise = require('promise');
var Sequelize = require('sequelize');


app.set('views', path.join(__dirname, 'views')); //set the views folder where the jade file resides
app.set('view engine', 'jade'); //sets the jade rendering

app.use(bodyParser.urlencoded({
	extended: true
})); // for parsing form data. 

app.listen(3000);

//Database
var pg = require('pg')
var connectionString = 'postgres://' + process.env.POSTGRES_USER + ':' + process.env.POSTGRES_PASSWORD + '@localhost/blog'; //credentials for the database.
var sequelize = new Sequelize(connectionString)

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
sequelize.sync()

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

app.get('/login', function(req, res) { // Get the login page. 
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
			if (user.password === req.body.password) { //otherwise if user exists and the password matches 
				req.session.user = user; //set cookie as user object. This contains every row of that specific user. email,password,username.
				console.log("here we go")
				res.redirect('/dashboard')
			} else {
				res.render('login', {
					error: "Invalid username or password"
				});
				console.log("something different went wrong")
			}
		}
	});
});

app.post('/users', function(req, res) { //Creating a new user.
	User.create({
		username: req.body.username, //create new user based on form data.
		password: req.body.password,
		email: req.body.email
	}).then(function() {
			res.render('login', {
				success: "The registration was succesful, please log-in!"
			});
			//returns to the log-in page with success message.
		}, function(error) { //upon error do the following:
			res.render('register', {
				matching: "It appears someone has already taken this username, please try something else!"
			});
			//error is only likely to occur from repeating the same username, display error and return to same page.
		}

	);
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