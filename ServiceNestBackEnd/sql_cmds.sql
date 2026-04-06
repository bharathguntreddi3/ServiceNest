CREATE DATABASE IF NOT EXISTS servicenest_db;

use servicenest_db;

-- table to store user data for register and login
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users ADD COLUMN phone VARCHAR(255) UNIQUE;

ALTER TABLE users ADD COLUMN last_login TIMESTAMP NULL DEFAULT NULL;

ALTER TABLE users 
ADD COLUMN is_blocked TINYINT(1) DEFAULT 0;

select * from users;

-- Insert into users(name, email, password) values("Bharath", "guntreddibharath@gmail.com", "000");

delete from users where id=12;

commit;

-- truncate table users;

-- cart items for a specific user 

-- table to store cart items add by each user linked to users table with foreign table 
CREATE TABLE cart_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    service_id INT NOT NULL,
    service_name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    quantity INT DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

select * from cart_items;

-- reviews table
CREATE TABLE reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  review TEXT NOT NULL,
  rating INT DEFAULT 5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

select * from reviews;

-- successfull bookings 
CREATE TABLE bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  service_id INT NOT NULL,
  service_name VARCHAR(255) NOT NULL,
  price INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

select * from bookings;

-- add new column role for users table to provide admin previlages to the admin dashboard 
alter table users add role varchar(100) default "user";

update users set role="admin" where email="guntreddibharath@gmail.com";

select * from users;

select * from reviews;

select * from cart_items;

select * from bookings;

CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    image TEXT NOT NULL
);

-- 1. Insert Categories
INSERT INTO categories (id, name, image) VALUES
(1, 'Home Cleaning', 'https://images.unsplash.com/photo-1581578731548-c64695cc6952'),
(2, 'Pest Control', 'https://plus.unsplash.com/premium_photo-1682126097276-57e5d1d3f812?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),
(3, 'Salon & Spa', 'https://images.unsplash.com/photo-1611169035510-f9af52e6dbe2?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),
(4, 'Painting', 'https://media.istockphoto.com/id/1198703852/photo/painter-man-at-work.jpg?s=1024x1024&w=is&k=20&c=BNL5wtm8ZJaAaOxUHI34HKdK3lSpGTXOFhgzcqqEfhk='),
(5, 'Electrician & Plumber', 'https://plus.unsplash.com/premium_photo-1682126049179-3c4e06049b55?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),
(6, 'AC & Fridge Repair', 'https://media.istockphoto.com/id/2206342744/photo/technician-repairing-air-conditioner-at-home.jpg?s=1024x1024&w=is&k=20&c=oPvjz7vd_3OTSZ2BV-Mf6kJR3rnP4X9VM71lJRoG9QY='),
(7, 'Bike Service', 'https://media.istockphoto.com/id/833171812/photo/we-look-forward-to-serving-you.jpg?s=1024x1024&w=is&k=20&c=1VOCBkDc0RSqQSGKz0Jf80_F1vse_gTM8SyLw6HK2VE='),
(8, 'Appliance Repair', 'https://plus.unsplash.com/premium_photo-1661342474567-f84bb6959d9f?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8YXBwbGlhbmNlJTIwcmVwYWlyfGVufDB8fDB8fHww'),
(9, 'Chef Service', 'https://plus.unsplash.com/premium_photo-1666299819315-929b3fae4450?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTN8fGNvb2tpbmd8ZW58MHx8MHx8fDA%3D');


CREATE TABLE IF NOT EXISTS services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    visit_price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);


-- 2. Insert Services (Linked using category_id)
INSERT INTO services (id, category_id, name, price, visit_price) VALUES
(1, 1, 'Basic Home Cleaning', 999, 99),
(2, 1, 'Deep Cleaning', 1999, 149),
(12, 1, 'Kitchen Cleaning Service', 899, 99),
(3, 2, 'Cockroach Control', 799, 99),
(4, 2, 'Termite Treatment', 2999, 199),
(5, 3, 'Haircut', 299, 49),
(6, 3, 'Facial', 599, 49),
(7, 4, 'Interior Painting', 4999, 299),
(8, 5, 'Switch Repair', 199, 49),
(9, 5, 'Leak Fix', 299, 49),
(10, 6, 'AC Service', 699, 99),
(13, 6, 'AC Cleaning Service', 999, 99),
(14, 6, 'Fridge Service', 499, 99),
(11, 7, 'Oil Change', 499, 49),
(15, 8, 'TV Service', 499, 99),
(16, 8, 'Washing Machine Service', 599, 99),
(17, 9, 'Personal Chef', 1499, 99);

select * from categories;

select * from services;

ALTER TABLE services ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;

CREATE TABLE popular_services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255),
  price DECIMAL(10, 2),
  image_url VARCHAR(500)
);

INSERT INTO popular_services (name, price, image_url) VALUES
('Full Home Cleaning', 1499.00, 'https://images.unsplash.com/photo-1581578731548-c64695cc6952'),
('Kitchen Deep Cleaning', 899.00, 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0'),
('Men Haircut', 299.00, 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0'),
('Women Spa', 999.00, 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0'),
('AC Repair', 499.00, 'https://media.istockphoto.com/id/2206342744/photo/technician-repairing-air-conditioner-at-home.jpg?s=1024x1024&w=is&k=20&c=oPvjz7vd_3OTSZ2BV-Mf6kJR3rnP4X9VM71lJRoG9QY='),
('Bike Oil Change', 399.00, 'https://media.istockphoto.com/id/833171812/photo/we-look-forward-to-serving-you.jpg?s=1024x1024&w=is&k=20&c=1VOCBkDc0RSqQSGKz0Jf80_F1vse_gTM8SyLw6HK2VE=');

select * from popular_services;



CREATE TABLE IF NOT EXISTS settings (
  setting_key VARCHAR(255) PRIMARY KEY,
  setting_value TEXT
);

-- these default values, which will be updated by the admin dashboard
INSERT INTO settings (setting_key, setting_value) VALUES
('siteName', 'ServiceNest'),
('supportEmail', 'servicenest358@gmail.com'),
('supportPhone', '+91 93929 57585'),
('enableRegistration', 'true'),
('enablePromoBanner', 'true'),
('requireOtpForUpdates', 'true'),
('sessionTimeout', '120')
ON DUPLICATE KEY UPDATE setting_key=setting_key;

select * from settings;

-- Weekly revenue  
SELECT SUM(
	CASE 
		WHEN booking_date >= DATE_SUB(NOW(), INTERVAL 1 WEEK) 
        THEN price * quantity ELSE 0 
	END
    ) as weeklyRevenue 
FROM bookings;

-- Average order value - average cost of each order placed
SELECT (SUM(price * quantity) / COUNT(*)) as averageOrderValue
FROM bookings;

-- total active users 
SELECT COUNT(*) as activeUsers
FROM users
WHERE is_blocked = 0 OR is_blocked IS NULL;

-- Total Bookings 
SELECT COUNT(*) as totalBookings
FROM bookings;

-- Coupons Table 

CREATE TABLE coupons (
  id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  code varchar(150) NOT NULL UNIQUE,
  description text,
  discount_percent int NOT NULL,
  is_active tinyint(1) NOT NULL DEFAULT '1',
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP
);

SELECT * FROM coupons;

INSERT INTO coupons (code, description, discount_percent) VALUES
('WELCOME50', 'Get 50% OFF on your first order.', 50),
('SAVE20', 'Save 20% on all services.', 20),
('NEST10', 'Flat 10% discount for returning customers.', 10)
ON DUPLICATE KEY UPDATE code=code;

ALTER TABLE users ADD COLUMN address TEXT DEFAULT NULL;

ALTER TABLE bookings
ADD COLUMN user_name VARCHAR(100),
ADD COLUMN address TEXT,
ADD COLUMN phone VARCHAR(25),
ADD COLUMN schedule_date DATE,
ADD COLUMN schedule_time VARCHAR(50),
ADD COLUMN payment_method VARCHAR(50);


select * from bookings;
select * from cart_items;
select * from categories;
select * from coupons;
select * from popular_services;
select * from reviews;
select * from services;
select * from settings;
select * from users;

ALTER TABLE bookings ADD COLUMN status VARCHAR(50) DEFAULT 'Pending';
