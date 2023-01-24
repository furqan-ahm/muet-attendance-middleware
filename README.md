# MUET Attendance Retrieval Server

Simple socketio server for retrieving attendance and  from mehran university website using their api, the server basically retrieves a response from their end point and then parses the HTML response, extract required bits of information and emit that information to the connected client sockets

# Only works on mehran university's network
Meaning that you either have to have a physical machine on their network or
you can host an ec2-instance on any platform (aws, gcp) and then connect that instance to mehrans network using university provided pptp vpn credentials

I used CentOS7 image on aws to host the server.
