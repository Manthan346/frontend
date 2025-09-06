import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import Modal from '../common/Modal';
import { Plus, Edit, Trash2, CheckCircle, Calendar, Clock, BookOpen } from 'lucide-react';
import MarksEntryModal from './MarksEntryModal';

const TestPage = () => {
  const [tests, setTests] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    subject: '',
    search: ''
  });

  // Modal states
  const [showTestModal, setShowTestModal] = useState(false);
  const [showMarksModal, setShowMarksModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [editingTest, setEditingTest] = useState(null);
  
  // Message states
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [form, setForm] = useState({
    title: '',
    subject: '',
    maxMarks: '',
    passingMarks: '',
    testDate: '',
    description: ''
  });

  // Get user role from localStorage
  const userRole = JSON.parse(localStorage.getItem('user'))?.role || 'student';

  useEffect(() => {
    fetchTests();
    fetchSubjects();
  }, []);

  const fetchTests = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.subject) params.append('subject', filters.subject);
      if (filters.search) params.append('search', filters.search);

      const res = await api.get(`/tests?${params.toString()}`);
      console.log('Fetched tests:', res.data);
      setTests(res.data.tests || []);
    } catch (error) {
      console.error('Error fetching tests:', error);
      setError('Failed to fetch tests');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/subjects');
      console.log('Fetched subjects:', res.data);
      setSubjects(res.data.subjects || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Apply filters
  const applyFilters = () => {
    fetchTests();
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({ subject: '', search: '' });
    setTimeout(fetchTests, 100);
  };

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // Open create modal
  const openCreateModal = () => {
    if (userRole === 'student') {
      setError('Students cannot create tests');
      return;
    }

    setEditingTest(null);
    setForm({
      title: '',
      subject: '',
      maxMarks: '',
      passingMarks: '',
      testDate: '',
      description: ''
    });
    setError('');
    setSuccess('');
    setShowTestModal(true);
  };

  // Open edit modal
  const openEditModal = (test) => {
    if (userRole === 'student') {
      setError('Students cannot edit tests');
      return;
    }

    console.log('Editing test:', test);
    setEditingTest(test);
    
    // Format date for input
    const testDate = new Date(test.testDate);
    const localDate = new Date(testDate.getTime() - testDate.getTimezoneOffset() * 60000);
    const formattedDate = localDate.toISOString().slice(0, 16);
    
    setForm({
      title: test.title || '',
      subject: test.subject?._id || '',
      maxMarks: test.maxMarks?.toString() || '',
      passingMarks: test.passingMarks?.toString() || '',
      testDate: formattedDate,
      description: test.description || ''
    });
    setError('');
    setSuccess('');
    setShowTestModal(true);
  };

  // Close test modal
  const closeTestModal = () => {
    setShowTestModal(false);
    setEditingTest(null);
    setError('');
    setSuccess('');
  };

  // Submit test
  const submitTest = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!form.title.trim()) {
      setError('Test title is required');
      return;
    }
    if (!form.subject) {
      setError('Subject selection is required');
      return;
    }
    if (!form.maxMarks || parseInt(form.maxMarks) <= 0) {
      setError('Valid maximum marks is required');
      return;
    }
    if (!form.passingMarks || parseInt(form.passingMarks) < 0) {
      setError('Valid passing marks is required');
      return;
    }
    if (parseInt(form.passingMarks) > parseInt(form.maxMarks)) {
      setError('Passing marks cannot be greater than maximum marks');
      return;
    }
    if (!form.testDate) {
      setError('Test date is required');
      return;
    }

    console.log('=== SUBMITTING TEST ===');
    console.log('Form data:', form);

    try {
      const submitData = {
        ...form,
        testType: 'exam', // Fixed as 'exam' instead of quiz/midterm/etc
        maxMarks: parseInt(form.maxMarks),
        passingMarks: parseInt(form.passingMarks)
      };

      if (editingTest) {
        const response = await api.put(`/tests/${editingTest._id}`, submitData);
        console.log('Update response:', response.data);
        setSuccess('Test updated successfully');
      } else {
        const response = await api.post('/tests', submitData);
        console.log('Create response:', response.data);
        setSuccess('Test created successfully');
      }
      
      fetchTests();
      setTimeout(() => {
        closeTestModal();
      }, 1500);
    } catch (error) {
      console.error('=== TEST ERROR ===');
      console.error('Error response:', error.response);
      setError(error.response?.data?.message || 'Failed to save test');
    }
  };

  // Delete test
  const deleteTest = async (id) => {
    if (userRole === 'student') {
      setError('Students cannot delete tests');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this test?')) return;
    
    try {
      await api.delete(`/tests/${id}`);
      setSuccess('Test deleted successfully');
      fetchTests();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error deleting test:', error);
      setError('Failed to delete test');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Open marks modal
  const openMarksModal = (test) => {
    if (userRole === 'student') {
      setError('Students cannot enter marks');
      return;
    }
    setSelectedTest(test);
    setShowMarksModal(true);
  };

  // Close marks modal
  const closeMarksModal = () => {
    setSelectedTest(null);
    setShowMarksModal(false);
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading tests...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Test Management</h2>
          <p className="text-gray-600 mt-1">Create and manage tests</p>
        </div>
        {(userRole === 'teacher' || userRole === 'admin') && (
          <Button 
            onClick={openCreateModal} 
            className="flex items-center gap-2 px-4 py-2"
          >
            <Plus size={20} />
            Create Test
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Search Tests"
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="Search by test title..."
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Subject
            </label>
            <select
              name="subject"
              value={filters.subject}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Subjects</option>
              {subjects.map(subject => (
                <option key={subject._id} value={subject._id}>
                  {subject.name} ({subject.code})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2">
            <Button onClick={applyFilters} className="flex-1">
              Apply Filters
            </Button>
            <Button onClick={clearFilters} variant="secondary">
              Clear
            </Button>
          </div>
        </div>
      </Card>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center">
          <span className="font-medium">Error:</span>
          <span className="ml-2">{error}</span>
          <button 
            onClick={() => setError('')}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center">
          <span className="font-medium">Success:</span>
          <span className="ml-2">{success}</span>
          <button 
            onClick={() => setSuccess('')}
            className="ml-auto text-green-500 hover:text-green-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Tests Grid */}
      {tests.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-xl text-gray-500 mb-2">No tests found</p>
            <p className="text-gray-400">
              {(userRole === 'teacher' || userRole === 'admin') 
                ? "Create your first test to get started" 
                : "No tests available at the moment"
              }
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tests.map(test => (
            <Card key={test._id} className="hover:shadow-lg transition-shadow">
              <div className="space-y-3">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-lg text-gray-900 leading-tight">
                    {test.title}
                  </h3>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    EXAM
                  </span>
                </div>

                {/* Content */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-600">
                    <BookOpen size={16} className="mr-2" />
                    <span><strong>Subject:</strong> {test.subject?.name || 'N/A'}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <Calendar size={16} className="mr-2" />
                    <span><strong>Date:</strong> {formatDate(test.testDate)}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <span className="font-medium text-gray-700">Max Marks:</span>
                      <div className="text-lg font-bold text-blue-600">{test.maxMarks}</div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Passing:</span>
                      <div className="text-lg font-bold text-green-600">{test.passingMarks}</div>
                    </div>
                  </div>

                  {test.description && (
                    <div className="pt-2 border-t">
                      <p className="text-gray-600 text-sm">{test.description}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {(userRole === 'teacher' || userRole === 'admin') && (
                  <div className="flex gap-2 pt-4 border-t">
                    <Button 
                      onClick={() => openEditModal(test)} 
                      size="sm"
                      className="flex items-center gap-1 flex-1"
                    >
                      <Edit size={16} />
                      Edit
                    </Button>
                    <Button 
                      onClick={() => deleteTest(test._id)} 
                      variant="danger" 
                      size="sm"
                      className="flex items-center gap-1 flex-1"
                    >
                      <Trash2 size={16} />
                      Delete
                    </Button>
                    <Button 
                      onClick={() => openMarksModal(test)} 
                      variant="success" 
                      size="sm"
                      className="flex items-center gap-1 flex-1"
                    >
                      <CheckCircle size={16} />
                      Marks
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Test Modal */}
      <Modal 
        isOpen={showTestModal} 
        onClose={closeTestModal}
        title={editingTest ? 'Edit Test' : 'Create New Test'}
        size="lg"
      >
        <form onSubmit={submitTest} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded text-sm">
              {success}
            </div>
          )}

          <Input
            label="Test Title"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="e.g., Mathematics Final Exam"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject <span className="text-red-500">*</span>
            </label>
            <select
              name="subject"
              value={form.subject}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select Subject</option>
              {subjects.map(subject => (
                <option key={subject._id} value={subject._id}>
                  {subject.name} ({subject.code})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Maximum Marks"
              name="maxMarks"
              type="number"
              min="1"
              max="1000"
              value={form.maxMarks}
              onChange={handleChange}
              required
            />
            <Input
              label="Passing Marks"
              name="passingMarks"
              type="number"
              min="0"
              value={form.passingMarks}
              onChange={handleChange}
              required
            />
          </div>

          <Input
            label="Test Date & Time"
            name="testDate"
            type="datetime-local"
            value={form.testDate}
            onChange={handleChange}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Brief description of the test..."
            />
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button type="submit" className="flex-1">
              {editingTest ? 'Update Test' : 'Create Test'}
            </Button>
            <Button type="button" variant="secondary" onClick={closeTestModal}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Marks Entry Modal */}
      {showMarksModal && selectedTest && (
        <MarksEntryModal
          test={selectedTest}
          isOpen={showMarksModal}
          onClose={closeMarksModal}
        />
      )}
    </div>
  );
};

export default TestPage;
