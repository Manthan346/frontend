import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import Modal from '../common/Modal';
import { Plus, Edit, Trash2 } from 'lucide-react';

const TeacherManagement = () => {
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    employeeId: '',
    subjects: []
  });

  useEffect(() => {
    fetchTeachers();
    fetchSubjects();
  }, []);

  const fetchTeachers = async () => {
    try {
      const res = await api.get('/admin/teachers');
      setTeachers(res.data.teachers || []);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      setError('Failed to fetch teachers');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/admin/subjects');
      setSubjects(res.data.subjects || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubjectChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setForm({ ...form, subjects: selectedOptions });
  };

  const openCreateModal = () => {
    setEditingTeacher(null);
    setForm({
      name: '',
      email: '',
      password: '',
      employeeId: '',
      subjects: []
    });
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  // THIS WAS MISSING - Edit Modal Function
  const openEditModal = (teacher) => {
    setEditingTeacher(teacher);
    setForm({
      name: teacher.name,
      email: teacher.email,
      password: '', // Don't pre-fill password for security
      employeeId: teacher.employeeId,
      subjects: teacher.subjects ? teacher.subjects.map(s => s._id) : []
    });
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTeacher(null);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingTeacher) {
        // Update teacher - don't send empty password
        const updateData = { ...form };
        if (!updateData.password) {
          delete updateData.password; // Don't send empty password
        }
        await api.put(`/admin/users/${editingTeacher._id}`, updateData);
        setSuccess('Teacher updated successfully');
      } else {
        // Create teacher
        await api.post('/admin/teachers', form);
        setSuccess('Teacher created successfully');
      }
      
      fetchTeachers();
      setTimeout(() => {
        closeModal();
      }, 1500);
    } catch (error) {
      console.error('Error saving teacher:', error);
      setError(error.response?.data?.message || 'Failed to save teacher');
    }
  };

  const deleteTeacher = async (id) => {
    if (!window.confirm('Are you sure you want to delete this teacher?')) return;
    
    try {
      await api.delete(`/admin/users/${id}`);
      setSuccess('Teacher deleted successfully');
      fetchTeachers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error deleting teacher:', error);
      setError('Failed to delete teacher');
      setTimeout(() => setError(''), 3000);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64">Loading teachers...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Teacher Management</h2>
        <Button onClick={openCreateModal} className="flex items-center gap-2">
          <Plus size={20} />
          Add Teacher
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

      {teachers.length === 0 ? (
        <Card>
          <p className="text-center text-gray-500 py-8">No teachers found.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teachers.map((teacher) => (
            <Card key={teacher._id}>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">{teacher.name}</h3>
                <p><strong>Email:</strong> {teacher.email}</p>
                <p><strong>Employee ID:</strong> {teacher.employeeId}</p>
                <p><strong>Subjects:</strong> {teacher.subjects?.map(s => s.name).join(', ') || 'None'}</p>
                
                <div className="flex gap-2 mt-4">
                  <Button 
                    onClick={() => openEditModal(teacher)} 
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Edit size={16} />
                    Edit
                  </Button>
                  <Button 
                    onClick={() => deleteTeacher(teacher._id)} 
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

      {/* Add/Edit Teacher Modal */}
      <Modal 
        isOpen={showModal} 
        onClose={closeModal}
        title={editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}
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
            label="Full Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
          />

          <Input
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
          />

          <Input
            label={editingTeacher ? "New Password (leave empty to keep current)" : "Password"}
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required={!editingTeacher}
          />

          <Input
            label="Employee ID"
            name="employeeId"
            value={form.employeeId}
            onChange={handleChange}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign Subjects
            </label>
            <select
              multiple
              value={form.subjects}
              onChange={handleSubjectChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              style={{ minHeight: '120px' }}
            >
              {subjects.map(subject => (
                <option key={subject._id} value={subject._id}>
                  {subject.name} ({subject.code})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Hold Ctrl/Cmd to select multiple subjects
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              {editingTeacher ? 'Update Teacher' : 'Create Teacher'}
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

export default TeacherManagement;
