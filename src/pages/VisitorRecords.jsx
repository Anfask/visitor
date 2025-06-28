'use client'

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import { db } from "../firebase/config"
import { format } from "date-fns"
import { 
  ArrowLeft, UserCircle, Clock, FileText, Phone, 
  Calendar, LogOut, MapPin, Building, User,
  CheckCircle, AlertCircle, Star, ClipboardCheck, Timer,
  MessageSquare
} from "lucide-react"
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

const VisitorRecords = () => {
  const [visitor, setVisitor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const { visitorId } = useParams()
  const navigate = useNavigate()
  
  const handleBack = () => {
    // Go back to previous page in history instead of directly to dashboard
    navigate(-1)
  }

  useEffect(() => {
    const fetchVisitor = async () => {
      setLoading(true)
      try {
        const visitorRef = doc(db, "visitors", visitorId)
        const visitorSnap = await getDoc(visitorRef)

        if (visitorSnap.exists()) {
          setVisitor({
            id: visitorSnap.id,
            ...visitorSnap.data(),
            checkInTime: visitorSnap.data().checkInTime?.toDate() || null,
            checkOutTime: visitorSnap.data().checkOutTime?.toDate() || null,
          })
        } else {
          MySwal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Visitor not found.',
          })
          navigate('/admin')
        }
      } catch (error) {
        MySwal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to fetch visitor data. Please try again.',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchVisitor()
  }, [visitorId, navigate])

  const handleCheckOut = async () => {
    setProcessing(true)
    try {
      const visitorRef = doc(db, "visitors", visitorId)
      const now = new Date()
      
      await updateDoc(visitorRef, {
        status: "checked-out",
        checkOutTime: serverTimestamp()
      })
      
      // Update local state
      setVisitor(prev => ({
        ...prev,
        status: "checked-out",
        checkOutTime: now
      }))
      
      MySwal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Visitor has been checked out successfully.',
        showConfirmButton: false,
        timer: 1500
      })
    } catch (error) {
      console.error("Error checking out visitor:", error)
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to check out visitor. Please try again.',
      })
    } finally {
      setProcessing(false)
    }
  }

  const calculateDuration = () => {
    if (!visitor?.checkInTime) return 'N/A'
    
    const endTime = visitor.checkOutTime || new Date()
    const diffMs = endTime - visitor.checkInTime
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    return diffHrs > 0 ? `${diffHrs}h ${diffMins}m` : `${diffMins}m`
  }

  const renderStarRating = (rating) => {
    if (!rating) return 'No rating provided';
    
    const ratingNumber = parseInt(rating);
    if (isNaN(ratingNumber)) return rating;
    
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={`h-4 w-4 ${i < ratingNumber ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} 
          />
        ))}
        <span className="ml-2 text-sm text-gray-600">{ratingNumber}/5</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-900/20 backdrop-blur-sm z-50">
        <div className="flex flex-col items-center bg-white p-8 rounded-xl shadow-2xl">
          <div className="relative h-14 w-14">
            <div className="absolute inset-0 rounded-full border-4 border-gray-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-violet-600 border-t-transparent animate-spin"></div>
          </div>
          <p className="mt-4 text-gray-700 font-medium">Loading visitor details...</p>
        </div>
      </div>
    )
  }

  if (!visitor) return null

  const isCheckedIn = visitor.status === "checked-in"
  const statusColor = isCheckedIn ? "emerald" : "amber";

  return (
    <div className="min-h-screen bg-gray-50">
      {processing && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50">
          <div className="bg-white p-6 rounded-xl shadow-2xl flex items-center space-x-4">
            <div className="relative h-8 w-8">
              <div className="absolute inset-0 rounded-full border-4 border-gray-100"></div>
              <div className="absolute inset-0 rounded-full border-4 border-violet-600 border-t-transparent animate-spin"></div>
            </div>
            <p className="text-gray-700 font-medium">Processing checkout...</p>
          </div>
        </div>
      )}
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center space-x-2 text-violet-600 hover:text-violet-800 transition-colors group"
          >
            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back</span>
          </button>
          
          <div className="flex items-center">
            <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
              isCheckedIn
                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                : "bg-amber-100 text-amber-800 border border-amber-200"
            }`}>
              {isCheckedIn ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Currently Checked In
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4 mr-2" />
                  Checked Out
                </>
              )}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Notification Banner - Only shows when checked out */}
        {!isCheckedIn && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8 rounded-lg shadow-sm flex items-start">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <p className="text-blue-700 font-medium">This visitor has checked out</p>
              <p className="text-blue-600 text-sm mt-1">
                This visitor checked out on {format(visitor.checkOutTime, "MMMM d, yyyy")} at {format(visitor.checkOutTime, "h:mm a")}
              </p>
            </div>
          </div>
        )}
        
        {/* Visitor Profile Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-8">
          {/* Gradient header */}
          <div className={`bg-gradient-to-r from-${statusColor}-400 to-${statusColor}-600 h-40 relative`}>
            <div className="absolute left-0 right-0 px-8 -bottom-20 flex items-end justify-between">
              <div className="flex items-end">
                {visitor.imageUrl ? (
                  <img
                    className="h-32 w-32 rounded-full object-cover border-4 border-white shadow-lg"
                    src={visitor.imageUrl}
                    alt={visitor.name}
                  />
                ) : (
                  <div className="h-32 w-32 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center">
                    <UserCircle className="h-16 w-16 text-gray-500" />
                  </div>
                )}
                <div className="ml-6 mb-6">
                  <h1 className="text-3xl font-bold text-black drop-shadow-sm">{visitor.name}</h1>
                  <div className="flex items-center mt-2 text-blue-500">
                    <FileText className="h-4 w-4 mr-2" />
                    <span>{visitor.idType || 'ID'}: {visitor.idNumber || 'N/A'}</span>
                  </div>
                </div>
              </div>
              
              {isCheckedIn && (
                <div className="mb-6">
                  <button
                    onClick={handleCheckOut}
                    disabled={processing}
                    className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-lg shadow-lg transition-all flex items-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed transform hover:scale-105"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="font-medium">Check Out Visitor</span>
                  </button>
                </div>
              )}
            </div>
            
            {/* Status pill */}
            <div className="absolute top-4 right-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                isCheckedIn
                  ? "bg-emerald-500 text-white"
                  : "bg-amber-500 text-white"
              }`}>
                {isCheckedIn ? 'Active Visit' : 'Visit Complete'}
              </span>
            </div>
          </div>
          
          {/* Stats cards */}
          <div className="pt-24 pb-6 px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
              <div className={`rounded-xl p-5 flex items-center ${
                isCheckedIn ? 'bg-emerald-50 border border-emerald-100' : 'bg-amber-50 border border-amber-100'
              }`}>
                <div className={`rounded-full p-3 ${
                  isCheckedIn ? 'bg-emerald-100' : 'bg-amber-100'
                } mr-4`}>
                  <Timer className={`h-6 w-6 ${
                    isCheckedIn ? 'text-emerald-600' : 'text-amber-600'
                  }`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Duration</p>
                  <p className="text-xl font-bold text-gray-900">{calculateDuration()}</p>
                </div>
              </div>
              
              <div className="rounded-xl p-5 bg-violet-50 border border-violet-100 flex items-center">
                <div className="rounded-full p-3 bg-violet-100 mr-4">
                  <Calendar className="h-6 w-6 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Check-In</p>
                  <p className="text-xl font-bold text-gray-900">
                    {visitor.checkInTime ? format(visitor.checkInTime, "h:mm a") : 'N/A'}
                  </p>
                </div>
              </div>
              
              <div className="rounded-xl p-5 bg-gray-50 border border-gray-200 flex items-center">
                <div className="rounded-full p-3 bg-gray-100 mr-4">
                  <LogOut className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Check-Out</p>
                  <p className="text-xl font-bold text-gray-900">
                    {visitor.checkOutTime ? format(visitor.checkOutTime, "h:mm a") : 'Pending'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Visitor Info Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column - Personal Info & Timeline */}
          <div className="lg:col-span-4 space-y-8">
            {/* Personal Info */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <User className="h-5 w-5 mr-2 text-violet-500" />
                  Personal Information
                </h2>
              </div>
              <div className="divide-y divide-gray-100">
                <div className="flex items-start p-5 hover:bg-gray-50 transition-colors">
                  <Phone className="h-5 w-5 text-gray-400 mt-0.5 mr-4" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Mobile Number</p>
                    <p className="text-gray-900 font-medium">{visitor.mobile || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="flex items-start p-5 hover:bg-gray-50 transition-colors">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5 mr-4" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Address</p>
                    <p className="text-gray-900 font-medium">{visitor.address || 'Not provided'}</p>
                  </div>
                </div>
                
                <div className="flex items-start p-5 hover:bg-gray-50 transition-colors">
                  <Building className="h-5 w-5 text-gray-400 mt-0.5 mr-4" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Designation</p>
                    <p className="text-gray-900 font-medium">{visitor.designation || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Timeline */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-violet-500" />
                  Visit Timeline
                </h2>
              </div>
              <div className="p-6">
                <div className="relative pl-8 border-l-2 border-gray-200 space-y-10">
                  {/* Check-in point */}
                  <div className="relative">
                    <div className="absolute -left-4 mt-1 h-8 w-8 rounded-full bg-emerald-500 border-4 border-white shadow-md flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    <div className="ml-6">
                      <p className="font-semibold text-gray-900">Checked In</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {visitor.checkInTime ? (
                          <>
                            {format(visitor.checkInTime, "MMMM d, yyyy")} at {format(visitor.checkInTime, "h:mm a")}
                          </>
                        ) : (
                          'Not checked in'
                        )}
                      </p>
                    </div>
                  </div>
                  
                  {/* Check-out point */}
                  <div className="relative">
                    <div className={`absolute -left-4 mt-1 h-8 w-8 rounded-full ${
                      visitor.checkOutTime ? 'bg-amber-500' : 'bg-gray-300'
                    } border-4 border-white shadow-md flex items-center justify-center`}>
                      <LogOut className="h-4 w-4 text-white" />
                    </div>
                    <div className="ml-6">
                      <p className="font-semibold text-gray-900">Checked Out</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {visitor.checkOutTime ? (
                          <>
                            {format(visitor.checkOutTime, "MMMM d, yyyy")} at {format(visitor.checkOutTime, "h:mm a")}
                          </>
                        ) : (
                          'Not checked out yet'
                        )}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Duration Card */}
                <div className={`mt-8 p-4 rounded-xl ${
                  isCheckedIn ? 'bg-emerald-50 border border-emerald-100' : 'bg-amber-50 border border-amber-100'
                }`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className={`text-sm font-medium ${
                        isCheckedIn ? 'text-emerald-600' : 'text-amber-600'
                      }`}>Total Visit Duration</p>
                      <p className="text-2xl font-bold text-gray-900">{calculateDuration()}</p>
                    </div>
                    <div className={`rounded-full p-3 ${
                      isCheckedIn ? 'bg-emerald-100' : 'bg-amber-100'
                    }`}>
                      <Clock className={`h-6 w-6 ${
                        isCheckedIn ? 'text-emerald-600' : 'text-amber-600'
                      }`} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Column - Visit Details */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <ClipboardCheck className="h-5 w-5 mr-2 text-violet-500" />
                  Visit Details
                </h2>
              </div>
              
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Purpose of Visit */}
                <div className="col-span-2 bg-violet-50 rounded-xl border border-violet-100 p-5">
                  <div className="flex items-center mb-4">
                    <div className="rounded-full p-2 bg-violet-100 mr-3">
                      <FileText className="h-5 w-5 text-violet-600" />
                    </div>
                    <h3 className="font-semibold text-violet-900">Purpose of Visit</h3>
                  </div>
                  <p className="text-gray-800">{visitor.purpose || 'No purpose specified'}</p>
                </div>
                
                {/* Host Information */}
                {visitor.hostName && (
                  <div className="bg-blue-50 rounded-xl border border-blue-100 p-5">
                    <div className="flex items-center mb-4">
                      <div className="rounded-full p-2 bg-blue-100 mr-3">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-blue-900">Meeting With</h3>
                    </div>
                    <p className="text-gray-800 font-medium">{visitor.hostName}</p>
                  </div>
                )}
                
                {/* Additional Notes */}
                {visitor.notes && (
                  <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center mb-4">
                      <div className="rounded-full p-2 bg-gray-200 mr-3">
                        <FileText className="h-5 w-5 text-gray-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900">Additional Notes</h3>
                    </div>
                    <p className="text-gray-800">{visitor.notes}</p>
                  </div>
                )}
                
                {/* Feedback Section */}
                <div className="col-span-2">
                  <h3 className="font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">Visitor Feedback</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Star Rating */}
                    <div className="bg-amber-50 rounded-xl border border-amber-100 p-5">
                      <div className="flex items-center mb-4">
                        <div className="rounded-full p-2 bg-amber-100 mr-3">
                          <Star className="h-5 w-5 text-amber-600" />
                        </div>
                        <h3 className="font-semibold text-amber-900">Rating</h3>
                      </div>
                      <div className="text-gray-800">
                        {renderStarRating(visitor.rating)}
                      </div>
                    </div>
                    
                    {/* Feedback comments */}
                    <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-5">
                      <div className="flex items-center mb-4">
                        <div className="rounded-full p-2 bg-emerald-100 mr-3">
                          <MessageSquare className="h-5 w-5 text-emerald-600" />
                        </div>
                        <h3 className="font-semibold text-emerald-900">Comments</h3>
                      </div>
                      <p className="text-gray-800">{visitor.feedback || 'No feedback provided'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="mt-8 flex justify-end">
              <button
                onClick={handleBack}
                className="bg-white border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg mr-4 hover:bg-gray-50 transition-colors font-medium shadow-sm"
              >
                Return
              </button>
              
              {isCheckedIn && (
                <button
                  onClick={handleCheckOut}
                  disabled={processing}
                  className="bg-amber-600 text-white px-5 py-2.5 rounded-lg hover:bg-amber-700 transition-colors flex items-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed font-medium shadow-md"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Mark as Checked Out</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default VisitorRecords