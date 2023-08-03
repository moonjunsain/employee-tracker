-- creating a database
DROP DATABASE IF EXISTS employee_db;
CREATE DATABASE employee_db;

-- selecting data base
USE employee_db;

-- creating table for department
CREATE TABLE departments(
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(30) NOT NULL,
    PRIMARY KEY(id)
);

-- creating table for role
CREATE TABLE roles(
    id INT NOT NULL AUTO_INCREMENT,
    title VARCHAR(30) NOT NULL,
    salary DECIMAL NOT NULL,
    department_id INT,
    PRIMARY KEY(id),
    FOREIGN KEY (department_id)
    REFERENCES departments(id)
    ON DELETE SET NULL
);

-- creating table for employee
CREATE TABLE employees(
    id INT AUTO_INCREMENT,
    first_name VARCHAR(30) NOT NULL,
    last_name VARCHAR(30) NOT NULL,
    role_id INT,
    manager_id INT DEFAULT null,
    
    PRIMARY KEY(id),
    FOREIGN KEY (role_id)
    REFERENCES  roles(id)
    ON DELETE SET NULL,
    FOREIGN KEY (manager_id)
    REFERENCES employees(id)
    ON DELETE SET NULL
);

SELECT * FROM employees LEFT JOIN employees ON employees.id = employees.manager_id;