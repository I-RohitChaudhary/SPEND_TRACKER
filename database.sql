CREATE DATABASE IF NOT EXISTS spend_tracker;

USE spend_tracker;

CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    amount DECIMAL(10,2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    note VARCHAR(250),
    date DATE NOT NULL
);