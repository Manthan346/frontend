import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Button from '../common/Button';
import Input from '../common/Input';

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    employeeId: '', // For teachers
    rollNumber: '', // For students
    department: '',
    year: 1 // For students
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    
    // Clear errors when user starts typing
    if (error) setError('');
  };

  const validateForm = () => {
    // Name validation
    if (!form.name.trim()) {
      setError('Name is required');
      return false;
    }
    
    if (form.name.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    // Password validation
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    // Confirm password
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    // Role-specific validation
    if (form.role === 'teacher' && !form.employeeId.trim()) {
      setError('Employee ID is required for teachers');
      return false;
    }

    if (form.role === 'student') {
      if (!form.rollNumber.trim()) {
        setError('Roll number is required for students');
        return false;
      }
      if (!form.department.trim()) {
        setError('Department is required for students');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');

    try {
      console.log('Submitting registration:', form);
      
      // Prepare data for backend
      const submitData = {
        name: form.name.trim(),
        email: form.email.toLowerCase().trim(),
        password: form.password,
        role: form.role
      };

      // Add role-specific fields
      if (form.role === 'teacher') {
        submitData.employeeId = form.employeeId.trim();
      }
      
      if (form.role === 'student') {
        submitData.rollNumber = form.rollNumber.trim();
        submitData.department = form.department.trim();
        submitData.year = parseInt(form.year);
      }

      console.log('Sending data:', submitData);
      
      const response = await api.post('/auth/register', submitData);
      
      console.log('Registration response:', response.data);
      
      setSuccess('Account created successfully! Please login.');
      
      // Clear form
      setForm({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'student',
        employeeId: '',
        rollNumber: '',
        department: '',
        year: 1
      });
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (error) {
      console.error('Registration error:', error);
      console.error('Error response:', error.response);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error ||
                          error.message ||
                          'Registration failed. Please try again.';
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create Account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join our education management system
          </p>
        </div>
        
        <form className="mt-8 space-y-6 bg-white p-6 rounded-lg shadow" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          
          {success && (
            <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              {success}
            </div>
          )}

          <Input
            label="Full Name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            required
            placeholder="Enter your full name"
          />

          <Input
            label="Email Address"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
            placeholder="Enter your email"
          />

          <Input
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
            placeholder="Minimum 6 characters"
          />

          <Input
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={handleChange}
            required
            placeholder="Re-enter your password"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Type
            </label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>

          {/* Teacher-specific fields */}
          {form.role === 'teacher' && (
            <Input
              label="Employee ID"
              name="employeeId"
              type="text"
              value={form.employeeId}
              onChange={handleChange}
              required
              placeholder="Enter employee ID"
            />
          )}

          {/* Student-specific fields */}
          {form.role === 'student' && (
            <>
              <Input
                label="Roll Number"
                name="rollNumber"
                type="text"
                value={form.rollNumber}
                onChange={handleChange}
                required
                placeholder="Enter roll number"
              />

              <Input
                label="Department"
                name="department"
                type="text"
                value={form.department}
                onChange={handleChange}
                required
                placeholder="e.g., Computer Science"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Academic Year
                </label>
                <select
                  name="year"
                  value={form.year}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value={1}>1st Year</option>
                  <option value={2}>2nd Year</option>
                  <option value={3}>3rd Year</option>
                  <option value={4}>4th Year</option>
                </select>
              </div>
            </>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>

          <div className="text-center">
            <span className="text-sm text-gray-600">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Sign in
              </button>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
