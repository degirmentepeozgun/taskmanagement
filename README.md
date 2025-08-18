The root folders of project must run seperately
within terminal or node.js command or powershell run these commands

-- cd backend

-- npm install

-- npm run dev


-- cd frontend

-- npm install

-- npm run dev

When you register your default role is being "User" and you can only see the tasks that "Admin" role sets for you.
There are dummy data in seed file already and for checking Admin user's side
Admin Username = adminuser
Admin Password = admin1234

For checking normal user's side
Username = testuser
Password = test1234

Only Admin role can create and delete task. Rest of users can only see the tasks of themselves.
