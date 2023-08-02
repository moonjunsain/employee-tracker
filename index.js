// import all the required file
const inq = require('inquirer');
const express = require('express');
const mysql = require('mysql2');
const Employee = require('./classes/employee')
const Role = require('./classes/role')

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
            choices: listOfDeptmnt
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
            choices: listOfRole
        },
        {
            type: 'list',
            message: "Who is the manager for the new employee",
            choices: listOfManager
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
        
        // display the departments in a nice formatted table
        console.log(`id\t name\n--\t -------------`)

        // iterate through the data to display everything
        for(let i = 0; i < data.length; i++){
            console.log(`${data[i].id}\t ${data[i].name}\n`)
        }
        
    }catch (err) {
        return console.log("Error while getting data from department")
    }
}

async function viewAllRoles() {
    try{
        const [data] = await db.promise().query("SELECT * FROM roles")

        console.log(`id title\t department\t salary`)
        console.log(`-- ------\t ----------\t --------`)
        for(let i = 0; i < data.length; i++){
            console.log(`${data[i].id} ${data[i].title}\t ${data[i].salary}`)
        }
        
    }catch(err){
        return console.log("Error while getting data from roles")
    }
}

async function addDepartment() {
    const depPrompt = {
        type: 'input',
        message: 'Enter the name of the new department',
        name: 'dptName'
    }
    try {
        const {dptName} = inq.prompt(depPrompt)
        await db.promise().query("INSERT INTO departments(name) VALUES (?)", dptName)
    }catch(err){
        return console.log("Error while adding department", err);
    }
}

async function addRole() {

}

async function addEmployee() {

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