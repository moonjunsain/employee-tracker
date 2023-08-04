// import all the required file
const inq = require('inquirer');

const mysql = require('mysql2');
const {Table} = require('console-table-printer')


const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "password",
    database: "employee_db"
})

db.connect((err)=> {
    if(err){
        return console.log("database failed to connect", err)
    }
    console.log("Connected to database")
    init()
})


// construct question for adding a role
const rolePromptConstructor = (listOfDeptmnt) => {
    return [
        {
            type: 'input',
            message: 'Enter the name of the new role',
            name: 'roleName',
            validate: function(input){
                if(input.length >= 30){
                    console.log("\nPlease enter less than 30 characters")
                    return false;
                }
                else {
                    return true;
                }
            }
        },
        {
            type: 'input',
            message: 'Enter the salary of this role',
            name: 'salary'
        },
        {
            type: 'list',
            message: 'What department does this role belong to?',
            choices: listOfDeptmnt,
            name: 'depName'
        }
    ]
} 

// construct a question for adding an employee
const empPromptConstructor = (listOfRole, listOfManager) => {
    return [
        {
            type: 'input',
            message: 'Enter the first name for the new employee',
            name: "firstName",
            validate: function(input){
                if(input.length >= 30){
                    console.log("\nPlease enter less than 30 characters")
                    return false;
                }
                else {
                    return true;
                }
            }
        },
        {
            type: 'input',
            message: 'Enter the last name for the new employee',
            name: "lastName",
            validate: function(input){
                if(input.length >= 30){
                    console.log("\nPlease enter less than 30 characters")
                    return false;
                }
                else {
                    return true;
                }
            }
        },
        {
            type: 'list',
            message: "What is the role for the new employee?",
            choices: listOfRole,
            name: "role"
        },
        {
            type: 'list',
            message: "Who is the manager for the new employee",
            choices: ["None", ...listOfManager],
            name: "manager"
        }
    ]

}

async function promptHomeMenu(){
    const homePrompt = {
        type: 'list',
        message: 'What would you like to do?',
        choices: ["View all departments", "View all roles", "View all employees", "Add a department", "Add a role", 
        "Add an employee", "Update an employee role", "Quit"],
        name: 'homeDecision'
    }
    const {homeDecision} = await inq.prompt(homePrompt)
    return homeDecision
}

async function init(){
    // create an infinite loop until the user chooses to Quit
    while(true){
        const decision = await promptHomeMenu()
        if(decision == 'Quit'){
            // break the loop when the user chooses to quit
            console.log("Bye!")
            process.exit(0)
            
        }
        // execute different functions depending on user decision
        switch (decision) {
            case "View all departments":
              await viewAllDepartments();
              break;
            case "View all roles":
              await viewAllRoles();
              break;
            case "View all employees":
              await viewAllEmployees();
              break;
            case "Add a department":
              await addDepartment();
              break;
            case "Add a role":
              await addRole();
              break;
            case "Add an employee":
              await addEmployee();
              break;
            case "Update an employee role":
              await updateEmployeeRole();
              break;
          }

    }
}

async function viewAllDepartments(){
    // gets the data from the database
    try{
        const [data] = await db.promise().query("SELECT * FROM departments")
        // since db returns an array within an array
        
        // use a console-table-printer package
        const table = new Table()
        table.addRows(data)
        table.printTable();
        
    }catch (err) {
        return console.log("Error while getting data from department")
    }
}

async function viewAllRoles() {
    try{
        const [data] = await db.promise().query("SELECT roles.id AS id, roles.title AS title, roles.salary AS salary, departments.name AS department FROM roles JOIN departments ON roles.department_id = departments.id")
       
        const table = new Table()
        table.addRows(data)
        table.printTable();
        
        
    }catch(err){
        return console.log("Error while getting data from roles")
    }
}

async function viewAllEmployees(){
    try{
        // self join to see associated manager
        const queryScript = `SELECT a.id AS id, a.first_name, a.last_name, b.first_name AS manager, roles.title AS title, roles.salary AS salary, departments.name AS department
        FROM employees a
        LEFT JOIN employees b ON a.manager_id = b.id
        LEFT JOIN roles ON roles.id = a.role_id 
        LEFT JOIN departments ON roles.department_id = departments.id
        ORDER BY department`
        const [data] = await db.promise().query(queryScript)
        const table = new Table()

        // change all nulls to None
        for(let i = 0; i < data.length; i++){
            if(data[i].manager == null){
                data[i].manager = 'None'
            }
        }
        table.addRows(data)
        table.printTable();
    }catch(err){
        return console.log("Error while viewing employee", err)
    }
}

async function addDepartment() {
    const depPrompt = {
        type: 'input',
        message: 'Enter the name of the new department',
        name: 'dptName',
        validate: function(input){
            if(input.length >= 30){
                console.log("\nPlease enter less than 30 characters")
                return false;
            }
            else {
                return true;
            }
        }
    }
    try {
        const {dptName} = await inq.prompt(depPrompt)
        await db.promise().query("INSERT INTO departments (name) VALUES (?)", [dptName])
        console.log(`\n========= ${dptName} was added =========\n`)
    }catch(err){
        return console.log("Error while adding department", err);
    }
}


async function addRole() {
    try {
        // gets the data from departments to get the department list
        const [data] = await db.promise().query("SELECT id value, name FROM departments")
        
        // calls the constructor function to form the array of question
        const rolePrompt = rolePromptConstructor(data)

        // asks the user questions
        const {roleName, salary, depName} = await inq.prompt(rolePrompt)

        // calls the db to add a new role
        await db.promise().query("INSERT INTO roles(title, salary, department_id) VALUES (?, ?, ?)", [roleName, salary, depName])
        console.log(`\n========= new role added =========\n`)

    }catch(err){
        return console.log("Error while trying to add roles", err)
    }
   
}



async function addEmployee() {
    try{
        // i need list of roles and list of employees
        // gets the data from data base
        const dataEmp = await db.promise().query('SELECT id value, concat(first_name, " ", last_name) name FROM employees')

        const dataRole = await db.promise().query('SELECT id value, title name FROM roles')
        console.log(dataRole);

        const employeePrompt = empPromptConstructor(dataRole[0], dataEmp[0])
        const {firstName, lastName, role, manager} = await inq.prompt(employeePrompt)

        await db.promise().query('INSERT INTO employees(first_name, last_name, role_id, manager_id) VALUES (?, ?, ?, ?)', [firstName, lastName, role, manager])
        console.log(`\n========= Employee added =========\n`)

    }catch(error){
        return console.log("Error while trying to add employee", error)
    }
}

async function updateEmployeeRole() {
    try{
        const [dataEmp] = await db.promise().query('SELECT id value, concat(first_name, "  ", last_name) name FROM employees')
        const [dataRole] = await db.promise().query('SELECT id value, title name FROM roles')

        const question = [
            {
                type: 'list',
                message: 'Which employee do you like to update?',
                choices: dataEmp,
                name: 'employee'
            },
            {
                type: 'list',
                message: 'Which role do you like to assign for this employee?',
                choices: dataRole,
                name: 'role'
            }
        ]

        const {employee, role} = await inq.prompt(question)

        await db.promise().query('UPDATE employees SET role_id = ? where id = ?', [role, employee])
        console.log(`\n========= updated =========\n`)


    }catch(err){
        return console.log("error while trying to update employee", err)
    }
}


// title screen 
console.log(`
______ __  __ _____  _      ______     __
|  ____|  \\\/  |  __ \\\| |    / __ \\ \\   / /
| |__  | \\  / | |__) | |   | |  | \\ \\\_/ / 
|  __| | |\\\/| |  ___/| |   | |  | |\\   /  
| |____| |  | | |    | |___| |__| | | |   
|______|_|__|_|_|____|______\\\____/__|_|   
|  ____|  ____|  ____|  ____|__   __|     
| |__  | |__  | |__  | |__     | |        
|  __| |  __| |  __| |  __|    | |        
| |____| |____| |____| |____   | |        
|______|______|______|______|  |_|        
                                          
`)



    
