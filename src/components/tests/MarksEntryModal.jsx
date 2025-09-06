import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { Save, Search, Users, CheckCircle, XCircle } from 'lucide-react';

const MarksEntryModal = ({ test, isOpen, onClose }) => {
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({});
  const [remarks, setRemarks] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen && test) {
      fetchStudents();
      fetchExistingResults();
    }
  }, [isOpen, test]);

  const fetchStudents = async () => {
    try {
      console.log('Fetching students...');
      const res = await api.get('/students');
      console.log('Students response:', res.data);
      
      // Handle different possible response structures
      const studentsList = res.data.students || res.data.users || res.data || [];
      setStudents(studentsList);
      
      if (studentsList.length === 0) {
        setError('No students found in the system. Please register some students first.');
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setError('Failed to fetch students: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingResults = async () => {
    try {
      const res = await api.get(`/tests/${test._id}/results`);
      const results = res.data.results || [];
      
      // Pre-populate existing marks
      const marksData = {};
      const remarksData = {};
      results.forEach(result => {
        marksData[result.student._id] = result.marksObtained;
        remarksData[result.student._id] = result.remarks || '';
      });
      setMarks(marksData);
      setRemarks(remarksData);
    } catch (error) {
      console.error('Error fetching existing results:', error);
      // Continue anyway - might be first time entering marks
    }
  };

  const handleMarksChange = (studentId, value) => {
    const numValue = value === '' ? '' : parseInt(value);
    if (numValue === '' || (numValue >= 0 && numValue <= test.maxMarks)) {
      setMarks(prev => ({
        ...prev,
        [studentId]: numValue
      }));
    }
  };

  const handleRemarksChange = (studentId, value) => {
    setRemarks(prev => ({
      ...prev,
      [studentId]: value
    }));
  };

  // Calculate grade
  const calculateGrade = (marksObtained) => {
    if (marksObtained === '' || marksObtained === null || marksObtained === undefined) return '';
    
    const percentage = (marksObtained / test.maxMarks) * 100;
    
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C+';
    if (percentage >= 40) return 'C';
    if (percentage >= 30) return 'D';
    return 'F';
  };

  // Check if passed
  const isPassed = (marksObtained) => {
    return marksObtained >= test.passingMarks;
  };

  // Get percentage
  const getPercentage = (marksObtained) => {
    if (marksObtained === '' || marksObtained === null || marksObtained === undefined) return '';
    return ((marksObtained / test.maxMarks) * 100).toFixed(1);
  };

  // Filter students
  const filteredStudents = students.filter(student =>
    student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const submitMarks = async () => {
    setError('');
    setSaving(true);

    try {
      const marksData = [];
      Object.keys(marks).forEach(studentId => {
        const marksObtained = marks[studentId];
        if (marksObtained !== '' && marksObtained !== undefined) {
          marksData.push({
            studentId,
            marksObtained: parseInt(marksObtained),
            percentage: parseFloat(getPercentage(marksObtained)),
            grade: calculateGrade(marksObtained),
            isPassed: isPassed(marksObtained),
            remarks: remarks[studentId] || ''
          });
        }
      });

      if (marksData.length === 0) {
        setError('Please enter marks for at least one student');
        return;
      }

      await api.post(`/tests/${test._id}/marks`, { marks: marksData });
      
      setSuccess(`Successfully saved marks for ${marksData.length} students`);
      
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error submitting marks:', error);
      setError(error.response?.data?.message || 'Failed to save marks');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setMarks({});
    setRemarks({});
    setSearchTerm('');
    setError('');
    setSuccess('');
    onClose();
  };

  if (!test) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      title={`Enter Marks - ${test.title}`}
      size="xl"
    >
      <div className="space-y-6">
        {/* Test Info */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-blue-800">Subject:</span>
              <div className="text-blue-700">{test.subject?.name}</div>
            </div>
            <div>
              <span className="font-medium text-blue-800">Max Marks:</span>
              <div className="text-blue-700 text-lg font-bold">{test.maxMarks}</div>
            </div>
            <div>
              <span className="font-medium text-blue-800">Passing Marks:</span>
              <div className="text-blue-700 text-lg font-bold">{test.passingMarks}</div>
            </div>
          </div>
        </div>

        {/* Messages */}
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

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-lg">Loading students...</div>
          </div>
        ) : (
          <>
            {/* Search */}
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search students by name or roll number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Users size={16} className="mr-1" />
                {filteredStudents.length} students
              </div>
            </div>

            {/* Students List */}
            {filteredStudents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {students.length === 0 ? 
                  'No students found in the system. Please register students first.' :
                  'No students found matching your search.'
                }
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto border rounded-lg">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Student
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Roll No.
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Marks (/{test.maxMarks})
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Grade
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Remarks
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStudents.map(student => {
                      const studentMarks = marks[student._id];
                      const studentRemarks = remarks[student._id] || '';
                      const grade = calculateGrade(studentMarks);
                      const passed = isPassed(studentMarks);
                      const percentage = getPercentage(studentMarks);

                      return (
                        <tr key={student._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {student.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {student.email}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {student.rollNumber || 'N/A'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                max={test.maxMarks}
                                value={studentMarks || ''}
                                onChange={(e) => handleMarksChange(student._id, e.target.value)}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="0"
                              />
                              {percentage && (
                                <span className="text-sm text-gray-600">({percentage}%)</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {grade && (
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                grade === 'A+' || grade === 'A' ? 'bg-green-100 text-green-800' :
                                grade === 'B+' || grade === 'B' ? 'bg-blue-100 text-blue-800' :
                                grade === 'C+' || grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                                grade === 'D' ? 'bg-orange-100 text-orange-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {grade}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {studentMarks !== '' && studentMarks !== undefined && (
                              <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${
                                passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {passed ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                {passed ? 'Pass' : 'Fail'}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={studentRemarks}
                              onChange={(e) => handleRemarksChange(student._id, e.target.value)}
                              placeholder="Optional remarks..."
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-6 border-t">
          <div className="text-sm text-gray-600">
            Enter marks for each student and grades will be calculated automatically
          </div>
          <div className="flex gap-3">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={handleClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={submitMarks}
              disabled={saving || loading || students.length === 0}
              className="flex items-center gap-2"
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Marks'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default MarksEntryModal;
