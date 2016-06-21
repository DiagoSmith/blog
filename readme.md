# Implementing 2SA into the Blog application
What we need to do: 

1, Add database fields for our additional values: "secret_code", "validated".

2, Set default values for the additional fields whenever a new user registers and gets added to the database. "validated" should be "false".

3, Upon login, we need to do the following:
-	a, Make the https request to the Highside API. (with)
-	b, Write the https response value containing the secret code into "secret_code" in the db. 
-	b2, Bonus point: add bcrypt to make the secret code even more secret.
-	c, Render a new page or form where the user can enter the secret code.
-	d, Add a way to check if the user is validated, prevent log-in forever if not validated. 

4, Upon secret code submission:
-	a, Check code against "secret_code" in database 
-	b, Change validated status if code is right
-	c, Do something else if it's wrong (e.g. a horrible message berating their forgetfulness)
-	c2, Bonus point: if it's wrong have functionality to send another code (remember to change the current “secret_code” in the database).
-	d, Set the session/other details as we would after a normal login.
-	e, Redirect the page to home/dashboard/whatever your landing page is. 


What the Highside API does:

1, Upon receiving the https get request: 
-	a, generate code
-	b, send code via sms/phone call to recipient found in the our get request attribute
-	c, return the https response with code and other variables back to our application.
