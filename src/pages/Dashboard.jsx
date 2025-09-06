import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Card from '../components/common/Card';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError('');
        
        let response;
        
        // Call correct endpoints based on user role
        if (user.role === 'student') {
          console.log('Fetching student dashboard for ID:', user.id);
          response = await api.get(`/dashboard/student/${user.id}`);
        } else if (user.role === 'teacher') {
          console.log('Fetching teacher dashboard for ID:', user.id);
          response = await api.get(`/dashboard/teacher/${user.id}`);
        } else if (user.role === 'admin') {
          console.log('Fetching admin dashboard');
          response = await api.get('/dashboard/admin');
        } else {
          throw new Error('Unknown user role');
        }
        
        console.log('Dashboard data received:', response.data);
        setDashboardData(response.data);
        
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }
    
    if (user.id && user.role) {
      fetchData();
    } else {
      setError('User information not found. Please login again.');
      setLoading(false);
    }
  }, [user.role, user.id]);

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Card className="max-w-md w-full">
          <div className="text-center text-red-600 space-y-4">
            <div className="text-5xl">⚠️</div>
            <h2 className="text-xl font-semibold">Dashboard Error</h2>
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        </Card>
      </div>
    );
  }

  // No data state
  if (!dashboardData) {
    return (
      <div className="text-center py-10">
        <div className="text-gray-500">No dashboard data available.</div>
      </div>
    );
  }

  // Student Dashboard
  if (user.role === 'student') {
    return (
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
          <div className="text-sm text-gray-500">
            Welcome back, {dashboardData.student?.name || user.name}!
          </div>
        </div>

        {/* Student Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard 
            title="Total Subjects" 
            value={dashboardData.stats?.totalSubjects || 0}
            icon="📚"
          />
          <StatCard 
            title="Total Tests" 
            value={dashboardData.stats?.totalTests || 0}
            icon="📝"
          />
          <StatCard 
            title="Completed Tests" 
            value={dashboardData.stats?.completedTests || 0}
            icon="✅"
          />
          <StatCard 
            title="Average Grade" 
            value={dashboardData.stats?.averageGrade || 'N/A'}
            icon="🎯"
          />
        </div>

        {/* Recent Tests */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-lg font-semibold mb-4">Recent Tests</h3>
            {dashboardData.recentTests?.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.recentTests.map(test => (
                  <div key={test._id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium">{test.title}</div>
                      <div className="text-sm text-gray-500">{test.subject?.name}</div>
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(test.testDate).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No recent tests</p>
            )}
          </Card>

          <Card>
            <h3 className="text-lg font-semibold mb-4">Upcoming Tests</h3>
            {dashboardData.upcomingTests?.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.upcomingTests.map(test => (
                  <div key={test._id} className="flex justify-between items-center p-3 bg-blue-50 rounded">
                    <div>
                      <div className="font-medium">{test.title}</div>
                      <div className="text-sm text-gray-500">{test.subject?.name}</div>
                    </div>
                    <div className="text-sm text-blue-600">
                      {new Date(test.testDate).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No upcoming tests</p>
            )}
          </Card>
        </div>

        {/* Subjects */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">My Subjects</h3>
          {dashboardData.subjects?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {dashboardData.subjects.map(subject => (
                <div key={subject._id} className="p-4 border rounded-lg">
                  <div className="font-medium">{subject.name}</div>
                  <div className="text-sm text-gray-500">{subject.code}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Teachers: {subject.teachers?.map(t => t.name).join(', ') || 'None'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No subjects assigned</p>
          )}
        </Card>
      </div>
    );
  }

  // Teacher Dashboard
  if (user.role === 'teacher') {
    return (
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
          <div className="text-sm text-gray-500">
            Welcome back, {dashboardData.teacher?.name || user.name}!
          </div>
        </div>

        {/* Teacher Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard 
            title="My Subjects" 
            value={dashboardData.stats?.totalSubjects || 0}
            icon="📚"
          />
          <StatCard 
            title="My Tests" 
            value={dashboardData.stats?.totalTests || 0}
            icon="📝"
          />
          <StatCard 
            title="Total Students" 
            value={dashboardData.stats?.totalStudents || 0}
            icon="👥"
          />
          <StatCard 
            title="Upcoming Tests" 
            value={dashboardData.stats?.upcomingTests || 0}
            icon="⏰"
          />
        </div>

        {/* Recent Tests */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-lg font-semibold mb-4">Recent Tests</h3>
            {dashboardData.recentTests?.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.recentTests.map(test => (
                  <div key={test._id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium">{test.title}</div>
                      <div className="text-sm text-gray-500">{test.subject?.name}</div>
                    </div>
                    <div className="text-sm text-gray-600">
                      Max: {test.maxMarks} | Pass: {test.passingMarks}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No recent tests</p>
            )}
          </Card>

          <Card>
            <h3 className="text-lg font-semibold mb-4">My Subjects</h3>
            {dashboardData.subjects?.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.subjects.map(subject => (
                  <div key={subject._id} className="p-3 bg-green-50 rounded">
                    <div className="font-medium">{subject.name}</div>
                    <div className="text-sm text-gray-500">{subject.code}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No subjects assigned</p>
            )}
          </Card>
        </div>
      </div>
    );
  }

  // Admin Dashboard
  if (user.role === 'admin') {
    return (
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="text-sm text-gray-500">
            System Overview
          </div>
        </div>

        {/* Admin Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard 
            title="Total Students" 
            value={dashboardData.stats?.totalStudents || 0}
            icon="👥"
          />
          <StatCard 
            title="Total Teachers" 
            value={dashboardData.stats?.totalTeachers || 0}
            icon="👨‍🏫"
          />
          <StatCard 
            title="Total Subjects" 
            value={dashboardData.stats?.totalSubjects || 0}
            icon="📚"
          />
          <StatCard 
            title="Total Tests" 
            value={dashboardData.stats?.totalTests || 0}
            icon="📝"
          />
        </div>

        {/* Recent Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-lg font-semibold mb-4">Recent Users</h3>
            {dashboardData.recentUsers?.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.recentUsers.map(user => (
                  <div key={user._id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                    <div className="text-sm text-gray-600 capitalize">
                      {user.role}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No recent users</p>
            )}
          </Card>

          <Card>
            <h3 className="text-lg font-semibold mb-4">Recent Tests</h3>
            {dashboardData.recentTests?.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.recentTests.map(test => (
                  <div key={test._id} className="p-3 bg-blue-50 rounded">
                    <div className="font-medium">{test.title}</div>
                    <div className="text-sm text-gray-500">
                      Subject: {test.subject?.name} | By: {test.createdBy?.name}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No recent tests</p>
            )}
          </Card>
        </div>
      </div>
    );
  }

  return <div>Unknown user role</div>;
};

// StatCard Component
const StatCard = ({ title, value, icon }) => (
  <Card>
    <div className="flex items-center">
      <div className="text-3xl mr-4">{icon}</div>
      <div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-sm text-gray-500">{title}</div>
      </div>
    </div>
  </Card>
);

export default Dashboard;
