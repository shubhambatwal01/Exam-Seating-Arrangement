import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Armchair,
  BookOpen,
  Building2,
  CalendarDays,
  DoorOpen,
  FileSpreadsheet,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import CollegeHeader from "./CollegeHeader";

const navigationItems = [
  ["/", "Dashboard", LayoutDashboard],
  ["/students", "Students", GraduationCap],
  ["/departments", "Departments", Building2],
  ["/courses", "Courses", BookOpen],
  ["/semesters", "Semesters", FileSpreadsheet],
  ["/subjects", "Subjects", BookOpen],
  ["/classrooms", "Classrooms", DoorOpen],
  ["/faculty", "Faculty", Users],
  ["/exam-sessions", "Exam Sessions", CalendarDays],
  ["/timetable", "Timetable", CalendarDays],
  ["/seating", "Seating", Armchair],
  ["/reports", "Reports", FileSpreadsheet],
  ["/users", "User Management", UserCog, "admin"],
  ["/settings", "Settings", Settings, "admin"],
];

export default function NavSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-white text-[#212529]">
      <CollegeHeader />

      <div className="no-print flex min-h-12 items-center border-y border-[#c5eef6] bg-[#cff4fc] px-3">
        <button
          type="button"
          className="mr-3 rounded p-1 hover:bg-white/70 lg:hidden"
          onClick={() => setMobileNavOpen((open) => !open)}
          aria-label="Toggle navigation"
        >
          {mobileNavOpen ? <X /> : <Menu />}
        </button>

        <span className="text-[18px] text-[#2E86C1] sm:text-[20px]">
          Exam Seating &amp; Timetable Management System (NEP)
        </span>

        <div className="ml-auto hidden items-center gap-3 sm:flex">
          <span className="rounded-full border border-[#0dcaf0] px-3 py-1 text-sm text-[#0aa2c0]">
            {user?.name} ({user?.role})
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1 rounded-md border border-[#dc3545] px-3 py-1.5 text-[#dc3545] hover:bg-[#dc3545] hover:text-white"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>

      <div className="relative flex">
        {mobileNavOpen && (
          <button
            type="button"
            aria-label="Close navigation overlay"
            className="no-print absolute inset-0 z-10 bg-black/10 lg:hidden"
            onClick={() => setMobileNavOpen(false)}
          />
        )}

        <aside
          className={`${mobileNavOpen ? "block" : "hidden"} no-print absolute left-0 top-0 z-20 min-h-[calc(100vh-48px)] w-64 border-r border-[#c5eef6] bg-[#f5fcfe] p-3 lg:sticky lg:top-0 lg:block lg:h-[calc(100vh-48px)]`}
        >
          <nav className="space-y-1">
            {navigationItems
              .filter((item) => !item[3] || item[3] === user?.role)
              .map(([to, label, Icon]) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/"}
                  onClick={() => setMobileNavOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-md px-3 py-2 text-sm ${
                      isActive
                        ? "bg-[#cff4fc] font-semibold text-[#0a6680]"
                        : "text-[#000000a6] hover:bg-white hover:text-black"
                    }`
                  }
                >
                  <Icon size={17} />
                  {label}
                </NavLink>
              ))}
          </nav>

          <button
            type="button"
            className="mt-5 flex w-full items-center gap-2 rounded-md border border-[#dc3545] px-3 py-2 text-sm text-[#dc3545] sm:hidden"
            onClick={handleLogout}
          >
            <LogOut size={16} />
            Logout
          </button>
        </aside>

        <main className="min-w-0 flex-1 p-3 sm:p-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
