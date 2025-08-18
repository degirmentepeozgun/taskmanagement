The root folders of project must run seperately
within terminal or node.js command or powershell run these commands

-- cd backend
-- npm install
-- npm run dev


-- cd frontend
-- npm install
-- npm run dev

When you register your default role is being "User" and you can only see the tasks that "Admin" role sets for you.
You must register with an account first and on postgre side you must set an Admin with
update "User" set "role" = 'Admin' where id = 1; //this is for setting and testing Admin scenarios

and for migration between postgresql and prisma
-- npx prisma migrate dev --name init
-- npm run dev

Only Admin role can create and delete task. Rest of users can only see the tasks of themselves.
