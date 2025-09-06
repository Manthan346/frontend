import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import Modal from '../common/Modal';
import MarksEntryModal from './MarksEntryModal';
import { Plus, Edit, Trash2, CheckCircle } from 'lucide-react';

const TestPage = () => {
  const [tests, setTests] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showTestModal, setShowTestModal] = useState(false);
  const [showMarksModal, setShowMarksModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [editingTest, setEditingTest] = useState(null);
  const [form, setForm] = useState({
    title: '',
    subject: '',
    maxMarks: '',
    passingMarks: '',
    testDate: '',
    description: '',
  });

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isTeacherOrAdmin = user.role === 'teacher' || user.role === 'admin';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [testsRes, subjectsRes] = await Promise.all([
        api.get('/tests'),
        // load only subjects this teacher/admin manages
        api.get(`/subjects?teacher=${user.id}`)
      ]);
      setTests(testsRes.data.tests || []);
      setSubjects(subjectsRes.data.subjects || []);
    } catch {
      setError('Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    if (!isTeacherOrAdmin) return;
    setForm({ title: '', subject: '', maxMarks: '', passingMarks: '', testDate: '', description: '' });
    setEditingTest(null);
    setError('');
    setSuccess('');
    setShowTestModal(true);
  };

  const openEditModal = test => {
    if (!isTeacherOrAdmin) return;
    const dt = new Date(test.testDate);
    const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0,16);
    setForm({
      title: test.title,
      subject: test.subject._id,
      maxMarks: test.maxMarks.toString(),
      passingMarks: test.passingMarks.toString(),
      testDate: local,
      description: test.description || '',
    });
    setEditingTest(test);
    setError('');
    setSuccess('');
    setShowTestModal(true);
  };

  const closeTestModal = () => {
    setShowTestModal(false);
    setEditingTest(null);
  };

  const submitTest = async e => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        maxMarks: parseInt(form.maxMarks,10),
        passingMarks: parseInt(form.passingMarks,10),
        testType: 'final'
      };
      if (editingTest) {
        await api.put(`/tests/${editingTest._id}`, payload);
        setSuccess('Test updated');
      } else {
        await api.post('/tests', payload);
        setSuccess('Test created');
      }
      fetchData();
      closeTestModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save test');
    }
  };

  const openMarksModal = test => {
    if (!isTeacherOrAdmin) return;
    setSelectedTest(test);
    setShowMarksModal(true);
  };

  const closeMarksModal = () => {
    setSelectedTest(null);
    setShowMarksModal(false);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Test Management</h1>
        {isTeacherOrAdmin && (
          <Button onClick={openCreateModal} className="flex items-center gap-2">
            <Plus size={18}/> Create Test
          </Button>
        )}
      </div>

      {error && <div className="text-red-600">{error}</div>}
      {success && <div className="text-green-600">{success}</div>}

      {tests.length === 0 ? (
        <Card>No tests available.</Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tests.map(test => (
            <Card key={test._id}>
              <h2 className="font-semibold">{test.title}</h2>
              <p className="text-sm">Subject: {test.subject.name}</p>
              <p className="text-sm">Date: {new Date(test.testDate).toLocaleDateString()}</p>
              <p className="text-sm">Max: {test.maxMarks}, Pass: {test.passingMarks}</p>
              {isTeacherOrAdmin && (
                <div className="mt-2 flex gap-2">
                  <Button size="sm" onClick={() => openMarksModal(test)}>
                    <CheckCircle size={16}/> Marks
                  </Button>
                  <Button size="sm" onClick={() => openEditModal(test)}>
                    <Edit size={16}/> Edit
                  </Button>
                  <Button variant="danger" size="sm" onClick={async()=>{
                    if(window.confirm('Delete?')){
                      await api.delete(`/tests/${test._id}`);
                      fetchData();
                    }
                  }}>
                    <Trash2 size={16}/> Delete
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Test Modal */}
      {showTestModal && (
        <Modal isOpen={showTestModal} onClose={closeTestModal} title={editingTest ? 'Edit Test' : 'Create Test'}>
          <form onSubmit={submitTest} className="space-y-4">
            <Input label="Title" name="title" value={form.title} onChange={e=>setForm({...form, title:e.target.value})} required />
            <div>
              <label className="block mb-1">Subject</label>
              <select
                name="subject"
                value={form.subject}
                onChange={e=>setForm({...form, subject:e.target.value})}
                className="w-full border p-2"
                required
              >
                <option value="">-- Select --</option>
                {subjects.map(s => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Max Marks" name="maxMarks" type="number" value={form.maxMarks} onChange={e=>setForm({...form, maxMarks:e.target.value})} required />
              <Input label="Passing Marks" name="passingMarks" type="number" value={form.passingMarks} onChange={e=>setForm({...form, passingMarks:e.target.value})} required />
            </div>
            <Input label="Date & Time" name="testDate" type="datetime-local" value={form.testDate} onChange={e=>setForm({...form, testDate:e.target.value})} required />
            <div>
              <label className="block mb-1">Description</label>
              <textarea
                name="description"
                rows={3}
                value={form.description}
                onChange={e=>setForm({...form, description:e.target.value})}
                className="w-full border p-2"
                placeholder="Optional"
              />
            </div>
            <div className="flex justify-end gap-2 pt-3">
              <Button type="submit">{editingTest ? 'Update' : 'Create'}</Button>
              <Button variant="secondary" onClick={closeTestModal}>Cancel</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Marks Entry Modal */}
      {showMarksModal && selectedTest && (
        <MarksEntryModal test={selectedTest} isOpen={showMarksModal} onClose={closeMarksModal} />
      )}
    </div>
  );
};

export default TestPage;
