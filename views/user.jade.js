html
head 
	script(src='http://ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min.js')
body
	h Users!

	each user in userlist
		//iterate through each user in the array. User is placeholder value here, not important, only important thing is defining the correct object passed into jade i.e userlist. 
		li=user.username    
		//important to specify the correct array key here. In this case it's username. 