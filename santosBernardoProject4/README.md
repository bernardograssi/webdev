
** Database Setup: **

 1. Install [MySQL](https://www.mysql.com/downloads/) and [MySQL Workbench](https://dev.mysql.com/downloads/workbench/).
 
 	1.1. Setup at localhost, w/ user=root and password=root.
 
 2. In MySQL shell, create database called project4 (`> create database project4`).
 
 3. Create table called accounts
 	
	3.1. ```CREATE TABLE `accounts` (`id` int NOT NULL AUTO_INCREMENT, `date` varchar(255) NOT NULL, `username` varchar(255) NOT NULL, `hash` varchar(255) NOT NULL, `salt` varchar(255) NOT NULL, `picture_path` varchar(255) NOT NULL, `followers` varchar(255) NOT NULL, `following` varchar(255) NOT NULL,PRIMARY KEY (`id`));``
 
 4. Create table called songs
    
    4.1. ```CREATE TABLE `songs` (`id` INT NOT NULL AUTO_INCREMENT,`username` varchar(255) NOT NULL,`song_path` varchar(255) NOT NULL,PRIMARY KEY (`id`));```
    
       - NOTE: We have noticed a bug where sometimes songs are not properly added to this database, and none of the songs will display on the webpage. While this is occasional, issuing ```DROP TABLE songs;``` and then recreating the table seems to fix the issue.
    
** Starting the Servers: **

    NOTE: The node_modules directory has been excluded from the .zip file due to it's size. Issuing ```npm i``` should create this directory and install any required dependencies. 

 1. To start the react server use ```npm start```.

 2. To start the backend express server, use the command ```node src/backend/server``` and the console should show: ```API is running on port 8080```.