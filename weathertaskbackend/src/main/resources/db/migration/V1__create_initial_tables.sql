CREATE TABLE account (
    p_account_id INT AUTO_INCREMENT PRIMARY KEY,
    login VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE tasks (
    p_task_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(100) NOT NULL,
    f_account_id INT NOT NULL,
    CONSTRAINT fk_tasks_account
        FOREIGN KEY (f_account_id) REFERENCES account(p_account_id)
);