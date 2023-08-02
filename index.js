// import all the required file
const inq = require('inquirer');
const express = require('express');
const mysql = require('mysql2');
const {Table} = require('console-table-printer')

const app = express();
const PORT = 3001;

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
})



const rolePromptConstructor = (listOfDeptmnt) => {
    return [
        {
            type: 'input',
            message: 'Enter the name of the new role',
            name: 'roleName'
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

const empPromptConstructor = (listOfRole, listOfManager) => {
    return [
        {
            type: 'input',
            message: 'Enter the first name for the new employee',
            name: "firstName"
        },
        {
            type: 'input',
            message: 'Enter the last name for the new employee',
            name: "lastName"
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
    const answer = await inq.prompt(homePrompt)
    const {homeDecision} = answer
    return homeDecision
}

async function init(){
    // create an infinite loop until the user chooses to Quit
    while(true){
        const decision = await promptHomeMenu()
        if(decision == 'Quit'){
            // break the loop when the user chooses to quit
            break;
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
        const [data] = await db.promise().query('SELECT employees.id, first_name, last_name, title, salary, departments.name AS department, manager_id FROM employees LEFT JOIN roles ON roles.id = employees.role_id LEFT JOIN departments ON roles.department_id = departments.id')
        const table = new Table()
        for(let i = 0; i < data.length; i++){
            if(data[i].manager_id == null){
                data[i].manager_id = 'None'
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
        name: 'dptName'
    }
    try {
        const {dptName} = await inq.prompt(depPrompt)
        await db.promise().query("INSERT INTO departments (name) VALUES (?)", [dptName])
    }catch(err){
        return console.log("Error while adding department", err);
    }
}

async function addRole() {
    try {
        // gets the data from departments to get the department list
        const [data] = await db.promise().query("SELECT * FROM departments")
        let depArry = []
        let depTracker = {}
        for(let i = 0; i < data.length; i++){
            // pushes all the name in the data (dep name)
            depArry.push(data[i].name)
            depTracker[data[i].name] = data[i].id
        }
        // calls the constructor function to form the array of question
        const rolePrompt = rolePromptConstructor(depArry)

        // asks the user questions
        const {roleName, salary, depName} = await inq.prompt(rolePrompt)
        
        // looks for an id in the data using depName
        const depId = depTracker[depName]

        // calls the db to add a new role
        await db.promise().query("INSERT INTO roles(title, salary, department_id) VALUES (?, ?, ?)", [roleName, salary, depId])

    }catch(err){
        return console.log("Error while trying to add roles", err)
    }
   
}



async function addEmployee() {
    try{
        // i need list of roles and list of employees
        // gets the data from data base
        const [data] = await db.promise().query('SELECT first_name, last_name, title, roles.id AS role_id, employees.id AS employee_id FROM employees JOIN roles ON roles.id = employees.role_id')
        

        // variable for all roles, names
        let roles = [];
        let fullNames = [];

        // to keep track of the id
        let roleTracker = {};
        let managerTracker = {};

        for(let i = 0; i < data.length; i++){
            // construct a full name from data
            let fullname = data[i].first_name + " " + data[i].last_name
            fullNames.push(fullname);
            managerTracker[fullname] = data[i].employee_id

            roles.push(data[i].title);
            roleTracker[data[i].title] = data[i].role_id
        }
        const employeePrompt = empPromptConstructor(roles, fullNames)
        const {firstName, lastName, role, manager} = await inq.prompt(employeePrompt)
       


        let managerId = 0
        if(manager == 'None'){
            managerId = null
        }else {
            managerId = managerTracker[manager]
        }
        await db.promise().query('INSERT INTO employees(first_name, last_name, role_id, manager_id) VALUES (?, ?, ?, ?)', [firstName, lastName, roleTracker[role], managerId])

    }catch(error){
        return console.log("Error while trying to add employee", error)
    }
}

async function updateEmployeeRole() {
    
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

init()

    

app.listen(PORT, ()=> {
    console.log(`Server running on port ${PORT}`)
})