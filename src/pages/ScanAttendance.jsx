import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import axios from 'axios';

const ScanAttendance = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [scannedQR, setScannedQR] = useState('');
  const [markedCourses, setMarkedCourses] = useState({});

  useEffect(() => {
    const scanner = new Html5QrcodeScanner('reader', {
      qrbox: { width: 250, height: 250 },
      fps: 10,
    });

    scanner.render(
      (decodedText) => {
        setScannedQR(decodedText);
        handleFetchStudent(decodedText);
      },
      () => {}
    );

    return () => {
      scanner.clear().catch((error) => console.error('Failed to clear scanner', error));
    };
  }, []);

  const handleFetchStudent = async (qrData) => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const response = await axios.get(`http://localhost:5000/api/students/scan/${qrData}`, config);
      setStudent(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid QR Code or Student Not Found');
      setStudent(null);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async (courseCode) => {
    setMessage('');
    setError('');

    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post(
        'http://localhost:5000/api/attendance/mark',
        { studentId: student.studentId, courseCode },
        config
      );

      setMessage(`Attendance marked successfully for ${courseCode}!`);
      setMarkedCourses((prev) => ({ ...prev, [courseCode]: true }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark attendance');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <nav className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-blue-400">Smart Attendance System</h1>
          <p className="text-xs text-slate-400">Invigilator Scanner Portal</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-slate-300">Invigilator: {user?.name}</span>
          <button
            onClick={handleLogout}
            className="bg-red-600/20 hover:bg-red-600 border border-red-500 text-red-400 hover:text-white px-3 py-1.5 rounded-lg text-sm transition"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="p-6 max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
          <h2 className="text-lg font-bold mb-4 text-blue-400 text-center">
            Scan Student QR Code
          </h2>
          
          <div id="reader" className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900"></div>

          <div className="mt-4 border-t border-slate-700 pt-4">
            <p className="text-xs text-slate-400 mb-2">Or test manually using QR Payload String:</p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="STUDENT_IT21009999"
                value={scannedQR}
                onChange={(e) => setScannedQR(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm"
              />
              <button
                onClick={() => handleFetchStudent(scannedQR)}
                className="bg-blue-600 hover:bg-blue-500 px-4 py-2 text-sm font-semibold rounded-lg"
              >
                Fetch
              </button>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold mb-4 text-blue-400 border-b border-slate-700 pb-2">
              Student Details & Eligibility
            </h2>

            {message && <div className="bg-green-500/10 border border-green-500 text-green-400 p-3 rounded-lg mb-4 text-sm">{message}</div>}
            {error && <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded-lg mb-4 text-sm">{error}</div>}

            {loading && <p className="text-slate-400 text-center py-8">Fetching student records...</p>}

            {student && !loading && (
              <div className="space-y-4">
                <div className="flex items-center gap-4 bg-slate-900 p-4 rounded-xl border border-slate-700">
                  <img
                    src={student.photoUrl || 'https://via.placeholder.com/80'}
                    alt="Student"
                    className="w-16 h-16 rounded-full object-cover border border-blue-500"
                  />
                  <div>
                    <h3 className="text-lg font-bold">{student.name}</h3>
                    <p className="text-sm font-mono text-blue-400">{student.studentId}</p>
                    <p className="text-xs text-slate-400">{student.faculty}</p>
                    <p className="text-xs text-slate-300 font-medium">{student.degree}</p>
                    <p className="text-xs text-slate-400">Year: {student.academicYear} | Sem: {student.semester}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Registered Courses
                  </h4>
                  <div className="space-y-2">
                    {student.courses.map((course, idx) => {
                      const isMarked = markedCourses[course.courseCode];
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between bg-slate-900 p-3 rounded-lg border border-slate-700"
                        >
                          <div>
                            <p className="font-bold text-sm">{course.courseCode}</p>
                            <p className="text-xs text-slate-400">{course.courseName}</p>
                          </div>

                          {isMarked ? (
                            <button
                              disabled
                              className="bg-slate-700 text-slate-400 font-bold text-xs px-3 py-1.5 rounded-lg cursor-not-allowed"
                            >
                              Marked ✓
                            </button>
                          ) : course.isEligible ? (
                            <button
                              onClick={() => handleMarkAttendance(course.courseCode)}
                              className="bg-green-600 hover:bg-green-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition shadow-lg shadow-green-600/20"
                            >
                              Mark Present
                            </button>
                          ) : (
                            <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-xs px-2.5 py-1 rounded-full font-bold">
                              NOT ELIGIBLE
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {!student && !loading && (
              <div className="text-center py-12 text-slate-500 text-sm">
                Scan a QR Code using camera or enter QR Payload to view student exam card.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScanAttendance;