# deskDutyScheduler

Note to self I had to :
py -m pip install ortools
npm i dropbox -- DONT NEED ANYMORE
npm i papaparse - dont even know if i need anymore


Instructions for use:


In the React UI: 
Cd into the react project
Install all dependencies with : npm i 
Open app with : npm run dev
Input the hours you are unavailable during the week as intervals
Once submitted, they will appear as CSV files (separate per person) in a dropbox with the given ACCESS_TOKEN

After all users have completed the form:
Download all the CSVs from that dropbox and put them in a folder, get that folder path and put into the optimizer python file
Set the number of RAs towards the top of the file to the number of CSVs you have downloaded
Run "py ./optimizer.py"
You might still have to run this command too: py -m pip install ortools


Potential Errors:

Check when you download all the unavailabilities that they are CSVs, Excel files will throw errors. Every unavailability must be a CSV!!!!

You HAVE to change the number of RAs to match the number of CSVs

Change the folder location "directory" variable to the path of the folder you are putting the CSVs -- you can get this path super easily by right clicking on the folder and hitting the "copy path" option 

Tip!
If someone doesn't submit their hours -- submit an empty form with just their name and it will stick them anywhere and they can trade amongst other RAs for hours that work for them