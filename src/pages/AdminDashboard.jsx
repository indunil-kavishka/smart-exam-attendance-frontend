import { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';

const facultiesData = {
  "Faculty of Animal Science & Export Agriculture": [
    "Export Agriculture Degree Programmes",
    "Animal Science Degree Programmes",
    "Food Science & Technology Degree Programmes"
  ],
  "Faculty of Applied Sciences": [
    "Bachelor of Science (BSc) in Computer Science and Technology",
    "Bachelor of Science (BSc) in Industrial Information Technology",
    "Bachelor of Technology in Science and Technology (BTech / ScienceTech)",
    "Bachelor of Science (BSc) in Mineral Resources and Technology (BSc / MRT)"
  ],
  "Faculty of Technological Studies": [
    "Bachelor of Engineering Technology Honours in Mechanical Engineering Technology",
    "Bachelor of Biosystems Technology Honours Degree",
    "Bachelor of Information and Communication Technology Honours Degree"
  ],
  "Faculty of Medicine": [
    "Bachelor of Medicine and Bachelor of Surgery (MBBS)"
  ],
  "Faculty of Management": [
    "Entrepreneurship and Management Degree Programme",
    "Hospitality, Tourism and Events Management Degree Programme"
  ]
};

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('addStudent');
  
  // Student Form State
  const [studentId, setStudentId] = useState('');
  const [name, setName] = useState('');
  const [faculty, setFaculty] = useState(Object.keys(facultiesData)[0]);
  const [degree, setDegree] = useState(facultiesData[Object.keys(facultiesData)[0]][0]);
  const [academicYear, setAcademicYear] = useState('2024/2025');
  const [semester, setSemester] = useState(1);
  const [photoFile, setPhotoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  
  const [courses, setCourses] = useState([
    { courseCode: 'ICT2101', courseName: 'Web Technologies', isEligible: true }
  ]);

  const [studentsList, setStudentsList] = useState([]);

  // User Management State (Separate messages to prevent overlapping)
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('ADMIN');
  const [userMessage, setUserMessage] = useState('');
  const [userError, setUserError] = useState('');

  // Attendance Logs & Filtering States
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [selectedFacultyFilter, setSelectedFacultyFilter] = useState('');
  const [selectedDegreeFilter, setSelectedDegreeFilter] = useState('');

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const qrRef = useRef(null);

  const handleFacultyChange = (selectedFaculty) => {
    setFaculty(selectedFaculty);
    const availableDegrees = facultiesData[selectedFaculty] || [];
    setDegree(availableDegrees[0] || '');
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const addCourseField = () => {
    setCourses([...courses, { courseCode: '', courseName: '', isEligible: true }]);
  };

  const handleCourseChange = (index, field, value) => {
    const updated = [...courses];
    updated[index][field] = value;
    setCourses(updated);
  };

  const fetchStudents = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get('http://localhost:5000/api/students', config);
      setStudentsList(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAttendanceLogs = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const response = await axios.get('http://localhost:5000/api/attendance', config);
      setAttendanceLogs(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      fetchAttendanceLogs();
      fetchStudents();
    }
  }, [user]);

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (Number(semester) < 1) {
      setError('Semester cannot be negative or less than 1');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('studentId', studentId);
      formData.append('name', name);
      formData.append('faculty', faculty);
      formData.append('degree', degree);
      formData.append('academicYear', academicYear);
      formData.append('semester', semester);
      formData.append('courses', JSON.stringify(courses));
      if (photoFile) {
        formData.append('photo', photoFile);
      }

      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'multipart/form-data',
        },
      };

      await axios.post('http://localhost:5000/api/students', formData, config);

      setMessage('Student added successfully!');
      fetchStudents();
      fetchAttendanceLogs();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add student');
    }
  };

  const handleRegisterUser = async (e) => {
    e.preventDefault();
    setUserMessage('');
    setUserError('');

    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post(
        'http://localhost:5000/api/auth/register',
        { name: newUserName, email: newUserEmail, password: newUserPassword, role: newUserRole },
        config
      );
      setUserMessage(`New ${newUserRole} registered successfully!`);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
    } catch (err) {
      setUserError(err.response?.data?.message || 'Failed to register user');
    }
  };

  const downloadQRCode = () => {
    const svgElement = qrRef.current?.querySelector('svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngFile;
      downloadLink.download = `QR_${studentId || 'Code'}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const printExamCard = () => {
    window.print();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Filter attendance logs based on selected Faculty and Degree
  const filteredAttendanceLogs = attendanceLogs.filter((log) => {
    const student = log.student;
    if (!student) return false;
    if (selectedFacultyFilter && student.faculty !== selectedFacultyFilter) return false;
    if (selectedDegreeFilter && student.degree !== selectedDegreeFilter) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Navbar */}
      <nav className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex justify-between items-center print:hidden">
        <div>
          <h1 className="text-xl font-bold text-blue-400">Smart Attendance System</h1>
          <p className="text-xs text-slate-400">Student Affairs Admin Portal</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-slate-300">Welcome, {user?.name}</span>
          <button
            onClick={handleLogout}
            className="bg-red-600/20 hover:bg-red-600 border border-red-500 text-red-400 hover:text-white px-3 py-1.5 rounded-lg text-sm transition"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex flex-wrap gap-4 mb-6 border-b border-slate-700 pb-2 print:hidden">
          <button
            onClick={() => setActiveTab('addStudent')}
            className={`px-4 py-2 font-medium rounded-lg transition ${
              activeTab === 'addStudent' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Add New Student & QR
          </button>

          <button
            onClick={() => {
              setActiveTab('viewStudents');
              fetchStudents();
            }}
            className={`px-4 py-2 font-medium rounded-lg transition ${
              activeTab === 'viewStudents' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            View Students List
          </button>

          {user?.email === 'admin@university.ac.lk' && (
            <button
              onClick={() => setActiveTab('addUser')}
              className={`px-4 py-2 font-medium rounded-lg transition ${
                activeTab === 'addUser' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              User Management
            </button>
          )}

          <button
            onClick={() => {
              setActiveTab('attendance');
              fetchAttendanceLogs();
            }}
            className={`px-4 py-2 font-medium rounded-lg transition ${
              activeTab === 'attendance' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Real-Time Attendance Logs
          </button>
        </div>

        {/* TAB 1: Add Student */}
        {activeTab === 'addStudent' && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl print:hidden">
              <h2 className="text-xl font-bold mb-4 text-blue-400">Register Student & Generate QR</h2>
              
              {message && <div className="bg-green-500/10 border border-green-500 text-green-400 p-3 rounded-lg mb-4 text-sm">{message}</div>}
              {error && <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded-lg mb-4 text-sm">{error}</div>}

              <form onSubmit={handleAddStudent} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Student ID</label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    required
                    placeholder="ICT23024"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="W.S.U.Fernando"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Faculty</label>
                  <select
                    value={faculty}
                    onChange={(e) => handleFacultyChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  >
                    {Object.keys(facultiesData).map((fac, idx) => (
                      <option key={idx} value={fac}>{fac}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Degree Programme</label>
                  <select
                    value={degree}
                    onChange={(e) => setDegree(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  >
                    {(facultiesData[faculty] || []).map((deg, idx) => (
                      <option key={idx} value={deg}>{deg}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Academic Year</label>
                    <input
                      type="text"
                      value={academicYear}
                      onChange={(e) => setAcademicYear(e.target.value)}
                      required
                      placeholder="2025/2026"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Semester (≥1)</label>
                    <input
                      type="number"
                      min="1"
                      value={semester}
                      onChange={(e) => setSemester(Math.max(1, Number(e.target.value)))}
                      required
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Student Photo</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="w-full text-xs text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-xs font-medium text-slate-400 mb-2">Registered Courses & Eligibility</label>
                  {courses.map((c, i) => (
                    <div key={i} className="flex gap-2 mb-2 items-center">
                      <input
                        type="text"
                        placeholder="Code (ICT2101)"
                        value={c.courseCode}
                        onChange={(e) => handleCourseChange(i, 'courseCode', e.target.value)}
                        required
                        className="w-1/3 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm text-white"
                      />
                      <input
                        type="text"
                        placeholder="Course Name"
                        value={c.courseName}
                        onChange={(e) => handleCourseChange(i, 'courseName', e.target.value)}
                        required
                        className="w-1/2 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm text-white"
                      />
                      <label className="flex items-center text-xs text-slate-300 gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={c.isEligible}
                          onChange={(e) => handleCourseChange(i, 'isEligible', e.target.checked)}
                          className="accent-blue-600"
                        />
                        Eligible
                      </label>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addCourseField}
                    className="text-xs text-blue-400 hover:underline mt-1"
                  >
                    + Add Another Course
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 font-semibold py-2.5 rounded-lg transition mt-4"
                >
                  Generate QR & Save Student
                </button>
              </form>
            </div>

            {/* Live QR Preview */}
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl flex flex-col items-center justify-center text-center print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
              <h3 className="text-lg font-bold text-slate-300 mb-4 print:text-black">
                Exam Admission Pass Preview
              </h3>

              {studentId ? (
                <div className="flex flex-col items-center">
                  <div ref={qrRef} className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 text-black flex flex-col items-center w-80">
                    <div className="text-xs font-bold text-blue-800 uppercase tracking-widest mb-2">
                      University Exam Pass
                    </div>
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Student"
                        className="w-20 h-20 rounded-full object-cover border-2 border-blue-600 mb-3"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center text-xs text-slate-500 mb-3 font-semibold">
                        No Photo
                      </div>
                    )}
                    <QRCodeSVG value={`STUDENT_${studentId}`} size={150} />
                    <p className="font-mono font-bold text-md text-slate-900 mt-3">{studentId}</p>
                    <p className="font-semibold text-slate-700 text-sm">{name || 'Student Name'}</p>
                    <p className="text-xs text-blue-900 font-medium mt-1">{degree}</p>
                    <p className="text-xs text-gray-500 mt-1">Year: {academicYear} | Sem: {semester}</p>
                  </div>

                  <div className="flex gap-3 mt-6 print:hidden">
                    <button
                      onClick={downloadQRCode}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2 rounded-lg text-sm transition"
                    >
                      Download QR
                    </button>
                    <button
                      onClick={printExamCard}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-lg text-sm transition"
                    >
                      Print Card
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-slate-500 text-sm print:hidden">
                  Enter Student details to preview and print.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: View Students List */}
        {activeTab === 'viewStudents' && (
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
            <h2 className="text-xl font-bold text-blue-400 mb-4">Registered Students Directory</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900 text-slate-400 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3">Photo</th>
                    <th className="px-4 py-3">Student ID</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Faculty & Degree</th>
                    <th className="px-4 py-3">Year / Sem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {studentsList.map((stu) => (
                    <tr key={stu._id} className="hover:bg-slate-750">
                      <td className="px-4 py-3">
                        <img
                          src={stu.photoUrl || 'https://via.placeholder.com/40'}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover border border-slate-600"
                        />
                      </td>
                      <td className="px-4 py-3 font-mono text-blue-400">{stu.studentId}</td>
                      <td className="px-4 py-3 font-semibold">{stu.name}</td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-bold text-slate-200">{stu.faculty}</p>
                        <p className="text-xs text-slate-400">{stu.degree}</p>
                      </td>
                      <td className="px-4 py-3 text-xs">Year: {stu.academicYear} | Sem: {stu.semester}</td>
                    </tr>
                  ))}
                  {studentsList.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center py-6 text-slate-500">No students registered yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: User Management (Super Admin Only) */}
        {activeTab === 'addUser' && user?.email === 'admin@university.ac.lk' && (
          <div className="max-w-xl mx-auto bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-blue-400">Register New System User</h2>
            
            {userMessage && <div className="bg-green-500/10 border border-green-500 text-green-400 p-3 rounded-lg mb-4 text-sm">{userMessage}</div>}
            {userError && <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded-lg mb-4 text-sm">{userError}</div>}

            <form onSubmit={handleRegisterUser} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  required
                  placeholder="Admin Samuditha"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Email Address</label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  required
                  placeholder="samuditha@university.ac.lk"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Password</label>
                <input
                  type="password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Assign Role</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="INVIGILATOR">INVIGILATOR</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 py-2.5 rounded-lg font-semibold transition">
                Create User Account
              </button>
            </form>
          </div>
        )}

        {/* TAB 4: Real-Time Attendance Logs (Organized by Faculty & Degree Filters) */}
        {activeTab === 'attendance' && (
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <h2 className="text-xl font-bold text-blue-400">Live Exam Attendance Logs</h2>
              
              {/* Faculty & Degree Filters */}
              <div className="flex flex-wrap gap-3">
                <select
                  value={selectedFacultyFilter}
                  onChange={(e) => {
                    setSelectedFacultyFilter(e.target.value);
                    setSelectedDegreeFilter(''); // Reset degree when faculty changes
                  }}
                  className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                >
                  <option value="">All Faculties</option>
                  {Object.keys(facultiesData).map((fac, idx) => (
                    <option key={idx} value={fac}>{fac}</option>
                  ))}
                </select>

                <select
                  value={selectedDegreeFilter}
                  onChange={(e) => setSelectedDegreeFilter(e.target.value)}
                  disabled={!selectedFacultyFilter}
                  className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white disabled:opacity-50"
                >
                  <option value="">All Degree Programmes</option>
                  {selectedFacultyFilter &&
                    (facultiesData[selectedFacultyFilter] || []).map((deg, idx) => (
                      <option key={idx} value={deg}>{deg}</option>
                    ))}
                </select>

                <button
                  onClick={fetchAttendanceLogs}
                  className="bg-slate-700 hover:bg-slate-600 text-xs px-3 py-2 rounded-lg text-slate-300 transition"
                >
                  Refresh
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900 text-slate-400 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3">Student ID</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Faculty & Degree</th>
                    <th className="px-4 py-3">Course</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Marked By</th>
                    <th className="px-4 py-3">Date & Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {filteredAttendanceLogs.map((log) => {
                    const logDate = new Date(log.createdAt || log.markedAt);
                    const stu = log.student;
                    return (
                      <tr key={log._id} className="hover:bg-slate-750">
                        <td className="px-4 py-3 font-mono text-blue-400">{log.studentId}</td>
                        <td className="px-4 py-3 font-semibold">{stu?.name || 'N/A'}</td>
                        <td className="px-4 py-3">
                          <p className="text-xs font-bold text-slate-200">{stu?.faculty || 'N/A'}</p>
                          <p className="text-xs text-slate-400">{stu?.degree || 'N/A'}</p>
                        </td>
                        <td className="px-4 py-3">{log.courseCode}</td>
                        <td className="px-4 py-3">
                          <span className="bg-green-500/20 text-green-400 border border-green-500/30 text-xs px-2 py-0.5 rounded-full font-bold">
                            {log.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400">{log.markedBy?.name || 'Invigilator'}</td>
                        <td className="px-4 py-3 text-xs text-slate-400">
                          {logDate.toLocaleDateString()} {logDate.toLocaleTimeString()}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredAttendanceLogs.length === 0 && (
                    <tr>
                      <td colSpan="7" className="text-center py-8 text-slate-500">
                        No attendance records found for the selected filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;