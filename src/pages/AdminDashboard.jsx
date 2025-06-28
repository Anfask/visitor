'use client'

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { signOut } from "firebase/auth"
import { collection, query, orderBy, getDocs, updateDoc, doc } from "firebase/firestore"
import { auth, db } from "../firebase/config"
import { format, differenceInMinutes } from "date-fns"
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import mainLogo from "../assets/logo.png"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
  AreaChart,
  BarChart,
  Bar,
} from "recharts"
import {
  LogOut,
  Users,
  UserCheck,
  UserMinus,
  Calendar,
  Filter,
  Bell,
  Menu,
  X,
  Activity,
  BarChart2,
  Clock,
  Home,
  Settings,
  User,
  Edit,
  UserCircle,
  FileText,
  Download,
  Printer,
  ChevronDown,
  Search,
} from "lucide-react"

const MySwal = withReactContent(Swal)

const VisitorRecord = ({ visitor, handleVisitorClick, handleManualCheckout, handleUpdateId }) => {
  return (
    <tr key={visitor.id} className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          {visitor.imageUrl ? (
            <img
              className="h-10 w-10 rounded-full object-cover"
              src={visitor.imageUrl}
              alt={visitor.name}
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <UserCircle className="h-5 w-5 text-indigo-600" />
            </div>
          )}
          <div className="ml-4">
            <button
              onClick={() => handleVisitorClick(visitor.id)}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
            >
              {visitor.name}
            </button>
            <div className="text-xs text-gray-500">
              {visitor.idType || 'N/A'}: {visitor.idNumber || 'N/A'}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{visitor.mobile || 'N/A'}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{visitor.designation || 'N/A'}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">
          {visitor.checkInTime ? format(visitor.checkInTime, "MMM dd, h:mm a") : 'N/A'}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">
          {visitor.checkOutTime ? format(visitor.checkOutTime, "MMM dd, h:mm a") : 'N/A'}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-3">
          {visitor.status === 'checked-in' && (
            <button
              onClick={() => handleManualCheckout(visitor.id)}
              className="text-xs px-2 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded"
            >
              Check-out
            </button>
          )}
          <button
            onClick={() => handleVisitorClick(visitor.id)}
            className="text-xs px-2 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded"
          >
            Details
          </button>
          <button
            onClick={() => handleUpdateId(visitor.id)}
            className="text-xs px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded"
          >
            Update ID
          </button>
        </div>
      </td>
    </tr>
  )
}

const AdminDashboard = () => {
  const [visitors, setVisitors] = useState([])
  const [activeVisitors, setActiveVisitors] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    checkedIn: 0,
    checkedOut: 0,
    today: 0,
  })
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterDate, setFilterDate] = useState("")
  const [loading, setLoading] = useState(true)
  const [visitorsByPurpose, setVisitorsByPurpose] = useState([])
  const [visitorsByDay, setVisitorsByDay] = useState([])
  const [visitorTrend, setVisitorTrend] = useState([])
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [notificationCount, setNotificationCount] = useState(0)
  const [lastVisitorId, setLastVisitorId] = useState(null)
  const [userEmail, setUserEmail] = useState("")
  const [activeView, setActiveView] = useState("dashboard")
  const [searchQuery, setSearchQuery] = useState("")

  const navigate = useNavigate()
  const COLORS = ["#6366F1", "#8B5CF6", "#EC4899", "#F97316", "#10B981"]

  useEffect(() => {
    setUserEmail(auth.currentUser?.email || "Admin")
    fetchVisitors()

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        navigate("/admin")
      }
    })

    // Handle mobile view
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(true)
      }
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => {
      unsubscribe()
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const fetchVisitors = async () => {
    setLoading(true)
    try {
      const visitorsRef = collection(db, "visitors")
      const q = query(visitorsRef, orderBy("checkInTime", "desc"))
      const querySnapshot = await getDocs(q)

      const visitorsData = []
      let checkedIn = 0
      let checkedOut = 0
      let today = 0
      const purposeCount = {}
      const dayCount = {}
      const last7DaysData = {}

      const todayDate = new Date().toDateString()

      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = format(date, "MMM dd")
        last7DaysData[dateStr] = 0
      }

      querySnapshot.forEach((doc) => {
        const visitor = {
          id: doc.id,
          ...doc.data(),
          checkInTime: doc.data().checkInTime?.toDate() || null,
          checkOutTime: doc.data().checkOutTime?.toDate() || null,
          imageUrl: doc.data().imageUrl || null,
        }

        visitorsData.push(visitor)

        if (!lastVisitorId || doc.id > lastVisitorId) {
          setNotificationCount((prev) => prev + 1)
          setLastVisitorId(doc.id)
        }

        if (visitor.status === "checked-in") checkedIn++
        else if (visitor.status === "checked-out") checkedOut++

        if (visitor.checkInTime && visitor.checkInTime.toDateString() === todayDate) today++

        const purpose = visitor.purpose || "Unknown"
        purposeCount[purpose] = (purposeCount[purpose] || 0) + 1

        if (visitor.checkInTime) {
          const day = visitor.checkInTime.toLocaleDateString("en-US", { weekday: "short" })
          dayCount[day] = (dayCount[day] || 0) + 1

          if (visitor.checkInTime >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
            const dateStr = format(visitor.checkInTime, "MMM dd")
            last7DaysData[dateStr] = (last7DaysData[dateStr] || 0) + 1
          }
        }
      })

      const purposeData = Object.entries(purposeCount).map(([name, value]) => ({ name, value }))
      const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
      const dayData = daysOfWeek.map((day) => ({ name: day, visitors: dayCount[day] || 0 }))
      const trendData = Object.entries(last7DaysData).map(([date, count]) => ({ date, visitors: count }))

      setVisitors(visitorsData)
      setActiveVisitors(visitorsData.filter((v) => v.status === "checked-in"))
      setStats({ total: visitorsData.length, checkedIn, checkedOut, today })
      setVisitorsByPurpose(purposeData)
      setVisitorsByDay(dayData)
      setVisitorTrend(trendData)
    } catch (error) {
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to fetch visitors. Please try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleManualCheckout = async (visitorId) => {
    const result = await MySwal.fire({
      title: 'Confirm Check-Out',
      text: 'Are you sure you want to check out this visitor?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Check Out',
      cancelButtonText: 'Cancel',
    })

    if (result.isConfirmed) {
      try {
        const visitorRef = doc(db, "visitors", visitorId)
        await updateDoc(visitorRef, {
          status: "checked-out",
          checkOutTime: new Date(),
        })
        await fetchVisitors()
        MySwal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Visitor checked out successfully!',
          timer: 1500,
          showConfirmButton: false,
        })
      } catch (error) {
        MySwal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to check out visitor. Please try again.',
        })
      }
    }
  }

  const handleUpdateId = async (visitorId) => {
    const result = await MySwal.fire({
      title: 'Update ID Information',
      html: `
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">ID Type</label>
          <select id="idType" class="swal2-input">
            <option value="Passport">Passport</option>
            <option value="Driver's License">Driver's License</option>
            <option value="National ID">National ID</option>
            <option value="Other">Other</option>
          </select>
          <label class="block text-sm font-medium text-gray-700 mt-4 mb-1">ID Number</label>
          <input id="idNumber" class="swal2-input" placeholder="Enter ID Number">
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Update',
      preConfirm: () => {
        const idType = document.getElementById('idType').value
        const idNumber = document.getElementById('idNumber').value
        if (!idType || !idNumber) {
          MySwal.showValidationMessage('Please fill in both fields')
          return false
        }
        return { idType, idNumber }
      },
    })

    if (result.isConfirmed) {
      try {
        const visitorRef = doc(db, "visitors", visitorId)
        await updateDoc(visitorRef, {
          idType: result.value.idType,
          idNumber: result.value.idNumber,
        })
        await fetchVisitors()
        MySwal.fire({
          icon: 'success',
          title: 'Success',
          text: 'ID information updated successfully!',
          timer: 1500,
          showConfirmButton: false,
        })
      } catch (error) {
        MySwal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to update ID information. Please try again.',
        })
      }
    }
  }

  const handleSignOut = async () => {
    const result = await MySwal.fire({
      title: 'Confirm Sign Out',
      text: 'Are you sure you want to sign out?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Sign Out',
      cancelButtonText: 'Cancel',
    })

    if (result.isConfirmed) {
      try {
        await signOut(auth)
        navigate("/admin")
        MySwal.fire({
          icon: 'success',
          title: 'Signed Out',
          text: 'You have been signed out successfully.',
          timer: 1500,
          showConfirmButton: false,
        })
      } catch (error) {
        MySwal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to sign out. Please try again.',
        })
      }
    }
  }

  const handleVisitorClick = (visitorId) => {
    navigate(`/admin/visitor/${visitorId}`)
  }

  const getFilteredVisitors = () => {
    return visitors.filter((visitor) => {
      // Apply search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (
          !visitor.name?.toLowerCase().includes(query) && 
          !visitor.purpose?.toLowerCase().includes(query) && 
          !visitor.mobile?.toLowerCase().includes(query) &&
          !visitor.email?.toLowerCase().includes(query)
        ) {
          return false
        }
      }
      
      // Apply status filter
      if (filterStatus !== "all" && visitor.status !== filterStatus) return false
      
      // Apply date filter
      if (filterDate && visitor.checkInTime) {
        const visitorDate = format(visitor.checkInTime, "yyyy-MM-dd")
        if (visitorDate !== filterDate) return false
      }
      
      return true
    })
  }

  const handleExportToCsv = () => {
    const filtered = getFilteredVisitors()
    const headers = ["Name", "Mobile", "Email", "Purpose", "Check-In Time", "Check-Out Time", "Status"]
    
    const csvContent = [
      headers.join(","),
      ...filtered.map(visitor => [
        visitor.name || "N/A",
        visitor.mobile || "N/A",
        visitor.email || "N/A",
        visitor.purpose || "N/A",
        visitor.checkInTime ? format(visitor.checkInTime, "yyyy-MM-dd HH:mm:ss") : "N/A",
        visitor.checkOutTime ? format(visitor.checkOutTime, "yyyy-MM-dd HH:mm:ss") : "N/A",
        visitor.status || "N/A"
      ].join(","))
    ].join("\n")
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
   V5Link.setAttribute("href", url)
    link.setAttribute("download", `visitors_report_${format(new Date(), "yyyy-MM-dd")}.csv`)
    link.style.display = "none"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePrint = () => {
    window.print()
  }

  const filteredVisitors = getFilteredVisitors()

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } },
  }

  const renderDashboardContent = () => (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-3xl font-bold text-gray-900">Dashboard Overview</h2>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-600">Last updated:</span>
          <span className="text-sm font-medium text-gray-900">{format(new Date(), "MMM dd, yyyy h:mm a")}</span>
          <button
            onClick={fetchVisitors}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {[
          {
            title: "Total Visitors",
            value: stats.total,
            icon: Users,
            color: "indigo",
            trend: "12% increase",
            trendColor: "green",
          },
          {
            title: "Currently Checked In",
            value: stats.checkedIn,
            icon: UserCheck,
            color: "green",
            trend: "5% increase",
            trendColor: "green",
          },
          {
            title: "Checked Out",
            value: stats.checkedOut,
            icon: UserMinus,
            color: "purple",
            trend: "Total completed visits",
            trendColor: "gray",
          },
          {
            title: "Today's Visitors",
            value: stats.today,
            icon: Calendar,
            color: "yellow",
            trend: "Active today",
            trendColor: "yellow",
            trendIcon: Clock,
          },
        ].map((stat) => (
          <div
            key={stat.title}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between()">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</h3>
                <p className={`text-xs mt-2 flex items-center text-${stat.trendColor}-600`}>
                  {stat.trendIcon ? <stat.trendIcon className="h-3 w-3 mr-1" /> : (
                    <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                  )}
                  <span>{stat.trend}</span>
                </p>
              </div>
              <div className={`h-12 w-12 rounded-full bg-${stat.color}-50 flex items-center justify-center`}>
                <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Charts Section */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Visitor Trend</h3>
            <select className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 90 days</option>
            </select>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={visitorTrend}>
                <defs>
                  <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="date" />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="visitors"
                  stroke="#6366F1"
                  fillOpacity={1}
                  fill="url(#colorVisitors)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Visitors by Purpose</h3>
            <button 
              onClick={() => setActiveView("reports")}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
            >
              <FileText className="h-4 w-4 mr-1" />
              View Reports
            </button>
          </div>
          <div className="h-80 flex items-center justify-center">
            {visitorsByPurpose.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={visitorsByPurpose}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {visitorsByPurpose.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [`${value} visitors`, name]}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                    }}
                  />
                  <Legend
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    wrapperStyle={{ paddingLeft: "20px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 italic">No purpose data available</p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Active Visitors Section */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-lg font-semibold text-gray-900">Currently Checked In</h3>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                {activeVisitors.length} Active
              </span>
              <button 
                onClick={() => setActiveView("visitors")}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-md flex items-center"
              >
                <Users className="h-3 w-3 mr-1" />
                View All Visitors
              </button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {["Visitor", "Mobile", "Check-In Time", "Purpose", "Duration", "Actions"].map((header) => (
                  <th
                    key={header}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {activeVisitors.length > 0 ? (
                activeVisitors.map((visitor) => {
                  const checkInTime = visitor.checkInTime
                  const now = new Date()
                  const diffMs = now - checkInTime
                  const diffH  = Math.floor(diffMs / (1000 * 60 * 60))
                  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
                  const duration = diffH > 0 ? `${diffH}h ${diffMins}m` : `${diffMins}m`

                  return (
                    <tr key={visitor.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {visitor.imageUrl ? (
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={visitor.imageUrl}
                              alt={visitor.name}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                              <UserCircle className="h-5 w-5 text-indigo-600" />
                            </div>
                          )}
                          <div className="ml-4">
                            <button
                              onClick={() => handleVisitorClick(visitor.id)}
                              className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                            >
                              {visitor.name}
                            </button>
                            <div className="text-xs text-gray-500">
                              {visitor.idType || 'N/A'}: {visitor.idNumber || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{visitor.mobile}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {visitor.checkInTime ? format(visitor.checkInTime, "MMM dd, h:mm a") : "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full">
                          {visitor.purpose || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                          {duration}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleManualCheckout(visitor.id)}
                            className="text-xs px-2 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded"
                          >
                            Check-out
                          </button>
                          <button
                            onClick={() => handleVisitorClick(visitor.id)}
                            className="text-xs px-2 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded"
                          >
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No active visitors
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <button
            onClick={() => setActiveView("visitors")}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center"
          >
            <ChevronDown className="h-4 w-4 mr-1" /> View all visitor records
          </button>
        </div>
      </motion.div>
    </motion.div>
  )

  const renderVisitorsContent = () => (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
      {/* Visitors Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-3xl font-bold text-gray-900">Visitor Records</h2>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search visitors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
            />
          </div>
          <button
            onClick={fetchVisitors}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            title="Refresh"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Filters & Export Options */}
      <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Filter className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Status</option>
                <option value="checked-in">Checked In</option>
                <option value="checked-out">Checked Out</option>
              </select>
            </div>
            <div className="relative">
              <Calendar className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleExportToCsv}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </button>
          </div>
        </div>
      </motion.div>

      {/* Visitors Table */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {["Name", "Mobile", "Email", "Check In Time", "Check Out Time", "Actions"].map((header) => (
                  <th
                    key={header}
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredVisitors.length > 0 ? (
                filteredVisitors.map((visitor) => (
                  <VisitorRecord
                    key={visitor.id}
                    visitor={visitor}
                    handleVisitorClick={handleVisitorClick}
                    handleManualCheckout={handleManualCheckout}
                    handleUpdateId={handleUpdateId}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No visitors found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  )

  const renderReportsContent = () => (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
      {/* Reports Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-3xl font-bold text-gray-900">Reports</h2>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
            />
          </div>
        </div>
      </div>

      {/* Reports Filters & Export */}
      <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Calendar className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleExportToCsv}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Report
            </button>
          </div>
        </div>
      </motion.div>

      {/* Reports Charts */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Visitors by Day</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={visitorsByDay}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                  }}
                />
                <Bar dataKey="visitors" fill="#6366F1" barSize={40} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Visitors by Purpose</h3>
          <div className="h-80 flex items-center justify-center">
            {visitorsByPurpose.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={visitorsByPurpose}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {visitorsByPurpose.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [`${value} visitors`, name]}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                    }}
                  />
                  <Legend
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    wrapperStyle={{ paddingLeft: "20px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 italic">No purpose data available</p>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )

  const renderContent = () => {
    switch (activeView) {
      case "dashboard":
        return renderDashboardContent()
      case "visitors":
        return renderVisitorsContent()
      case "reports":
        return renderReportsContent()
      default:
        return renderDashboardContent()
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: sidebarOpen ? 0 : -300 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg lg:static lg:z-auto"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <img src={mainLogo} alt="Logo" className="h-16 w-auto" />
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="p-4 space-y-2">
          {[
            { name: "Dashboard", icon: Home, view: "dashboard" },
            { name: "Visitors", icon: Users, view: "visitors" },
            { name: "Reports", icon: BarChart2, view: "reports" },
            { name: "Settings", icon: Settings, view: "settings" },
          ].map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveView(item.view)}
              className={`flex items-center w-full px-4 py-2 text-sm font-medium rounded-lg ${
                activeView === item.view
                  ? "bg-indigo-50 text-indigo-600"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.name}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 w-full p-4 border-t border-gray-200">
  <button
    onClick={handleSignOut}
    className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md"
  >
    <LogOut className="h-5 w-5 mr-2" />
    Sign Out
  </button>
</div>


      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Bell className="h-6 w-6 text-gray-600" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-medium text-white bg-red-600 rounded-full">
                  {notificationCount}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <User className="h-6 w-6 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">{userEmail}</span>
            </div>
          </div>
        </header>
        <main className="p-6">
          <AnimatePresence mode="wait">
            {renderContent()}
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}

export default AdminDashboard