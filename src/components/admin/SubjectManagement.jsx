import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import Modal from '../common/Modal';
import { Plus, Edit, Trash2 } from 'lucide-react';

const SubjectManagement = () => {
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    name: '',
    code: '',
    description: '',
    department: '',
    credits: 3,
    teachers: []
  });

  useEffect(() => {
    fetchSubjects();
    fetchTeachers();
  }, []);

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/admin/subjects');
      console.log('Fetched subjects:', res.data); // Debug log
      setSubjects(res.data.subjects || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      setError('Failed to fetch subjects');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await api.get('/admin/teachers');
      console.log('Fetched teachers:', res.data); // Debug log
      setTeachers(res.data.teachers || []);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleTeacherChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setForm({ ...form, teachers: selectedOptions });
  };

  const openCreateModal = () => {
    setEditingSubject(null);
    setForm({
      name: '',
      code: '',
      description: '',
      department: '',
      credits: 3,
      teachers: []
    });
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const openEditModal = (subject) => {
    console.log('Editing subject:', subject); // Debug log
    setEditingSubject(subject);
    setForm({
      name: subject.name,
      code: subject.code,
      description: subject.description || '',
      department: subject.department,
      credits: subject.credits || 3, // Default to 3 if credits is missing
      teachers: subject.teachers ? subject.teachers.map(t => t._id) : []
    });
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSubject(null);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    console.log('=== FRONTEND SUBMIT ===');
    console.log('Form data:', form);
    console.log('Editing subject:', editingSubject);

    try {
      if (editingSubject) {
        console.log('Updating subject:', editingSubject._id);
        const response = await api.put(`/admin/subjects/${editingSubject._id}`, form);
        console.log('Update response:', response.data);
        setSuccess('Subject updated successfully');
      } else {
        console.log('Creating new subject');
        const response = await api.post('/admin/subjects', form);
        console.log('Create response:', response.data);
        setSuccess('Subject created successfully');
      }
      
      fetchSubjects();
      setTimeout(() => {
        closeModal();
      }, 1500);
    } catch (error) {
      console.error('=== FRONTEND ERROR ===');
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      setError(error.response?.data?.message || 'Failed to save subject');
    }
  };

  const deleteSubject = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subject?')) return;
    
    try {
      await api.delete(`/admin/subjects/${id}`);
      setSuccess('Subject deleted successfully');
      fetchSubjects();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error deleting subject:', error);
      setError('Failed to delete subject');
      setTimeout(() => setError(''), 3000);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64">Loading subjects...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Subject Management</h2>
        <Button onClick={openCreateModal} className="flex items-center gap-2">
          <Plus size={20} />
          Add Subject
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      {subjects.length === 0 ? (
        <Card>
          <p className="text-center text-gray-500 py-8">No subjects found.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((subject) => (
            <Card key={subject._id}>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">{subject.name}</h3>
                <p><strong>Code:</strong> {subject.code}</p>
                <p><strong>Department:</strong> {subject.department}</p>
                {/* FIXED: Added credits display */}
                <p><strong>Credits:</strong> {subject.credits || 3}</p>
                {subject.description && (
                  <p><strong>Description:</strong> {subject.description}</p>
                )}
                <p><strong>Teachers:</strong> {subject.teachers?.map(t => t.name).join(', ') || 'None assigned'}</p>
                
                <div className="flex gap-2 mt-4">
                  <Button 
                    onClick={() => openEditModal(subject)} 
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Edit size={16} />
                    Edit
                  </Button>
                  <Button 
                    onClick={() => deleteSubject(subject._id)} 
                    variant="danger" 
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Trash2 size={16} />
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Subject Modal */}
      <Modal 
        isOpen={showModal} 
        onClose={closeModal}
        title={editingSubject ? 'Edit Subject' : 'Add New Subject'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
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
            label="Subject Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="e.g., Mathematics"
            required
          />

          <Input
            label="Subject Code"
            name="code"
            value={form.code}
            onChange={handleChange}
            placeholder="e.g., MATH101"
            required
          />

          <Input
            label="Department"
            name="department"
            value={form.department}
            onChange={handleChange}
            placeholder="e.g., Engineering"
            required
          />

          <Input
            label="Credits"
            name="credits"
            type="number"
            min="1"
            max="10"
            value={form.credits}
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
              placeholder="Brief description of the subject..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign Teachers
            </label>
            <select
              multiple
              value={form.teachers}
              onChange={handleTeacherChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              style={{ minHeight: '120px' }}
            >
              {teachers.map(teacher => (
                <option key={teacher._id} value={teacher._id}>
                  {teacher.name} ({teacher.employeeId})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Hold Ctrl/Cmd to select multiple teachers
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              {editingSubject ? 'Update Subject' : 'Create Subject'}
            </Button>
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SubjectManagement;
