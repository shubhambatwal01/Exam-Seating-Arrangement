# 📚 Exam Seating Arrangement & Timetable Management System

A full-stack web application that automates **exam timetable generation** and **seating arrangements** for fresh and backlog students. The system minimizes scheduling conflicts, optimizes classroom allocation, and generates downloadable reports, reducing the manual effort involved in examination management.

---

## 🚀 Features

* 👨‍🎓 Student Management (Fresh & Backlog Students)
* 📥 Excel-Based Student Data Import
* 📅 Automatic Exam Timetable Generation
* 🪑 Intelligent Seating Arrangement Generation
* 🏫 Classroom & Capacity Management
* 🗺️ Hall-wise Seating Visualization
* 📄 Export Reports in PDF and Excel Formats
* 🔐 Secure Authentication & Role-Based Access Control
* 📱 Fully Responsive User Interface
* ⚡ RESTful API Architecture
* 📊 Dashboard with Examination Statistics
* 👨‍💼 Admin Panel for Examination Staff

---

## 🛠️ Tech Stack

### Frontend

* React.js
* Vite
* Tailwind CSS
* React Router
* Axios

### Backend

* Node.js
* Express.js
* JWT Authentication
* bcrypt.js

### Database

* MongoDB
* Mongoose

### File Processing

* ExcelJS
* Multer

### Report Generation

* PDFKit
* ExcelJS

### Deployment

* Frontend: Vercel / Netlify
* Backend: Render
* Database: MongoDB Atlas

---

## 📂 Project Structure

```text
Exam-Seating-Arrangement/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── uploads/
│   ├── utils/
│   ├── package.json
│   └── server.js
│
├── README.md
└── .gitignore
```

---

## ✨ Modules

* Authentication
* Dashboard
* Student Management
* Course Management
* Department Management
* Semester Management
* Subject Management
* Classroom Management
* Examination Session Management
* Faculty Management
* Excel Import
* Timetable Generation
* Seating Arrangement Generation
* PDF & Excel Export
* User Management

---

## 📸 Screenshots

> Add screenshots of your application here.

* Login Page
* Dashboard
* Student Management
* Timetable Generator
* Seating Arrangement
* Reports

---

## ⚙️ Installation

### Clone the Repository

```bash
git clone https://github.com/shubhambatwal01/Exam-Seating-Arrangement.git

cd Exam-Seating-Arrangement
```

---

### Backend Setup

```bash
cd backend

npm install

npm run dev
```

---

### Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

---

## 🔐 Environment Variables

Create a `.env` file inside the backend folder.

```env
PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_secret_key

CLIENT_URL=http://localhost:5173
```

---

## 📊 Workflow

1. Login as Administrator
2. Import Student Data using Excel
3. Add Departments, Courses, Subjects, and Classrooms
4. Create an Examination Session
5. Generate the Exam Timetable
6. Generate Seating Arrangements
7. View Hall Allocations
8. Export Timetable and Seating Reports as PDF or Excel

---

## 📈 Future Enhancements

* Email Notifications
* QR Code Based Hall Tickets
* AI-Based Seating Optimization
* SMS Alerts
* Invigilator Allocation
* Multi-College Support
* Attendance Tracking
* Analytics Dashboard
* Dark Mode
* Audit Logs

---

## 🤝 Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch

```bash
git checkout -b feature/NewFeature
```

3. Commit your changes

```bash
git commit -m "Add New Feature"
```

4. Push the branch

```bash
git push origin feature/NewFeature
```

5. Open a Pull Request

---

## 🐞 Issues

If you find any bugs or have feature suggestions, please create an issue in the GitHub repository.

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Developer

**Shubham Suresh Batwal**

* GitHub: https://github.com/shubhambatwal01/
* LinkedIn: https://linkedin.com/in/shubhambatwal01/
* Portfolio: https://shubz-portfolio.vercel.app/

---

## ⭐ Support

If you found this project useful, please consider giving it a ⭐ on GitHub. It helps others discover the project and motivates future development.
