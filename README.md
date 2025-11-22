
---

# 📘 SkillHub – MERN Stack Learning Platform

A full-stack **MERN-based e-learning platform** that provides two user roles: **Student** and **Faculty**.
Students can learn courses and earn certificates, while faculty members can manage courses and track enrollments.

---

## 🚀 Features

### 👨‍🎓 **Student Features**

* Register & Login (JWT authentication)
* Browse available courses
* Enroll in a course
* Learn modules or lessons
* Get an auto-generated certificate after completing the course
* Download the certificate

### 👩‍🏫 **Faculty Features**

* Register & Login
* Add new courses
* Edit/update existing courses
* View number of enrolled students
* Export enrolled students' list as **Excel (.xlsx)**
* Manage course details and content

### 🔐 **Authentication**

* Fully secured JWT-based authentication
* Role-based access (`student`, `faculty`)
* Protected routes on both frontend and backend

---

## 🌐 Project Flow

### **Student Flow**

1. Student registers → logs in
2. Views list of available courses
3. Enrolls into a course
4. Accesses learning modules
5. After completion → student receives a certificate
6. Certificate can be viewed and downloaded

### **Faculty Flow**

1. Faculty registers → logs in
2. Adds new courses
3. Edits or updates existing courses
4. Views how many students enrolled
5. Downloads enrolled students' data as an Excel sheet

---

## 🛠️ Tech Stack (MERN)

### **Frontend**

* React.js
* React Router
* Axios
* Tailwind CSS / CSS

### **Backend**

* Node.js
* Express.js
* JWT Authentication
* Multer (if used for file uploads)

### **Database**

* MongoDB + Mongoose



---

## 📂 Folder Structure

```
SkillHub/
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   └── App.js
│   ├── package.json
│
└── README.md
```

---

## ⚙️ Installation & Setup

### **1️⃣ Clone the Repository**

```bash
git clone https://github.com/murali3633/SkillHub.git
cd SkillHub
```

---

### **2️⃣ Backend Setup**

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:

```
MONGO_URI=your_mongodb_url
JWT_SECRET=your_secret_key
PORT=5000
```

Start backend:

```bash
npm start
```

---

### **3️⃣ Frontend Setup**

```bash
cd ../frontend
npm install
npm start
```

Frontend runs on:

```
http://localhost:3000
```

Backend runs on:

```
http://localhost:5000
```

---

## 🔌 API Routes (Overview)

### **Auth**

```
POST /api/auth/register
POST /api/auth/login
```

### **Courses (Faculty)**

```
POST /api/courses/add
PUT  /api/courses/edit/:id
GET  /api/courses/enrolled/:courseId
GET  /api/courses/enrolled/export/:courseId    # Excel export
```

### **Courses (Student)**

```
GET  /api/courses
POST /api/courses/enroll/:courseId
GET  /api/certificate/:courseId
```

---

## 📄 Certificates

* Auto-generated after student completes course
* Downloadable as a file
* Stored either locally or cloud (based on your setup)

---

## 📈 Future Enhancements

* Admin Dashboard
* Video-based lessons
* Payment Gateway Integration
* Faculty Approval System
* Student Progress Tracking

---

## ⭐ Conclusion

SkillHub is a complete MERN stack learning platform with real-world functionality, role-based access, course management, and certificate generation.

---


