INSERT INTO departments (name)
VALUES ("Creative Services"), ("Data Analytics"), ("Customer Experience"), ("Research and Development"), ("Quality Assurance");

INSERT INTO roles (title, salary, department_id)
VALUES ("role 1", 1000, 1),
("role 2", 2000, 2),
("role 3", 3000, 3),
("role 4", 4000, 4);

INSERT INTO employees (first_name, last_name, role_id)
VALUES ("Elijah", "Gonzalez", 1), 
("Sophia", "Chen", 1), 
("Liam", "Anderson", 2), 
("Isabella", "Nguyen", 4), 
("Mason", "Garcia", 3);
