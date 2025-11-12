'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { Class, Subject, Note } from '@/types';
import { BookOpen, Plus, Users, LogOut, ArrowLeft } from 'lucide-react';

interface DashboardProps {
  user: User;
}

export default function Dashboard({ user }: DashboardProps) {
  // State
  const [userProfile, setUserProfile] = useState<any>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [showJoinClass, setShowJoinClass] = useState(false);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [showCreateNote, setShowCreateNote] = useState(false);

  // Form fields
  const [className, setClassName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [error, setError] = useState('');

  // Load user profile and classes
  useEffect(() => {
    loadUserData();
  }, [user]);

  // Load subjects when class selected
  useEffect(() => {
    if (selectedClass) {
      loadSubjects(selectedClass.id);
    }
  }, [selectedClass]);

  // Load notes when subject selected
  useEffect(() => {
    if (selectedSubject) {
      loadNotes(selectedSubject.id);
    }
  }, [selectedSubject]);

  const loadUserData = async () => {
    try {
      // Get user profile
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      setUserProfile(profile);

      // Get user's classes
      const { data: classMembers } = await supabase
        .from('class_members')
        .select('class_id')
        .eq('user_id', user.id);

      if (classMembers && classMembers.length > 0) {
        const classIds = classMembers.map((cm) => cm.class_id);
        const { data: userClasses } = await supabase
          .from('classes')
          .select('*')
          .in('id', classIds)
          .order('created_at', { ascending: false });

        setClasses(userClasses || []);
      }
    } catch (err) {
      console.error('Error loading user data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSubjects = async (classId: string) => {
    try {
      const { data } = await supabase
        .from('subjects')
        .select('*')
        .eq('class_id', classId)
        .order('created_at', { ascending: false });

      setSubjects(data || []);
    } catch (err) {
      console.error('Error loading subjects:', err);
    }
  };

  const loadNotes = async (subjectId: string) => {
    try {
      const { data } = await supabase
        .from('notes')
        .select('*')
        .eq('subject_id', subjectId)
        .order('updated_at', { ascending: false });

      setNotes(data || []);
    } catch (err) {
      console.error('Error loading notes:', err);
    }
  };

  const handleCreateClass = async () => {
    if (!className.trim()) {
      setError('Please enter a class name');
      return;
    }

    try {
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Create class
      const { data: newClass, error: classError } = await supabase
        .from('classes')
        .insert({
          name: className,
          invite_code: inviteCode,
          created_by: user.id,
        })
        .select()
        .single();

      if (classError) throw classError;

      // Add creator as member
      await supabase
        .from('class_members')
        .insert({
          class_id: newClass.id,
          user_id: user.id,
          role: 'admin',
        });

      setClasses([newClass, ...classes]);
      setClassName('');
      setShowCreateClass(false);
      setError('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleJoinClass = async () => {
    if (!inviteCode.trim()) {
      setError('Please enter an invite code');
      return;
    }

    try {
      // Find class by invite code
      const { data: foundClass, error: findError } = await supabase
        .from('classes')
        .select('*')
        .eq('invite_code', inviteCode.toUpperCase())
        .single();

      if (findError || !foundClass) {
        setError('Invalid invite code');
        return;
      }

      // Check if already member
      const { data: existing } = await supabase
        .from('class_members')
        .select('*')
        .eq('class_id', foundClass.id)
        .eq('user_id', user.id)
        .single();

      if (existing) {
        setError('You are already a member of this class');
        return;
      }

      // Join class
      await supabase
        .from('class_members')
        .insert({
          class_id: foundClass.id,
          user_id: user.id,
          role: 'member',
        });

      setClasses([foundClass, ...classes]);
      setInviteCode('');
      setShowJoinClass(false);
      setError('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAddSubject = async () => {
    if (!subjectName.trim() || !selectedClass) {
      setError('Please enter a subject name');
      return;
    }

    try {
      const colors = ['blue', 'green', 'purple', 'pink', 'yellow', 'red', 'indigo'];
      const icons = ['📚', '🔬', '🎨', '💻', '🌍', '📊', '🎵'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      const randomIcon = icons[Math.floor(Math.random() * icons.length)];

      const { data: newSubject, error } = await supabase
        .from('subjects')
        .insert({
          name: subjectName,
          class_id: selectedClass.id,
          color: randomColor,
          icon: randomIcon,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setSubjects([newSubject, ...subjects]);
      setSubjectName('');
      setShowAddSubject(false);
      setError('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreateNote = async () => {
    if (!noteTitle.trim() || !selectedSubject) {
      setError('Please enter a note title');
      return;
    }

    try {
      const { data: newNote, error } = await supabase
        .from('notes')
        .insert({
          title: noteTitle,
          content: '',
          subject_id: selectedSubject.id,
          author_id: user.id,
          is_public: true,
        })
        .select()
        .single();

      if (error) throw error;

      setNotes([newNote, ...notes]);
      setNoteTitle('');
      setShowCreateNote(false);
      setError('');
      alert('Note created! (Full editor coming in next phase)');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading your data...</div>
      </div>
    );
  }

  // Rendering logic continues in next message due to size...
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-primary-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ClassNotes</h1>
              <p className="text-sm text-gray-600">
                Welcome, {userProfile?.full_name || user.email}!
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* No class selected - show class list */}
        {!selectedClass && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">My Classes</h2>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowJoinClass(true)}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Join Class
                </button>
                <button
                  onClick={() => setShowCreateClass(true)}
                  className="btn-primary flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Class
                </button>
              </div>
            </div>

            {classes.length === 0 ? (
              <div className="text-center py-16">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">You're not part of any class yet</p>
                <button onClick={() => setShowCreateClass(true)} className="btn-primary">
                  Create Your First Class
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes.map((cls) => (
                  <div
                    key={cls.id}
                    onClick={() => setSelectedClass(cls)}
                    className="card"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                          {cls.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Code: <span className="font-mono font-bold">{cls.invite_code}</span>
                        </p>
                      </div>
                      <Users className="w-6 h-6 text-primary-600" />
                    </div>
                    {cls.description && (
                      <p className="text-sm text-gray-600">{cls.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Class selected - show subjects */}
        {selectedClass && !selectedSubject && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <button
                  onClick={() => setSelectedClass(null)}
                  className="text-primary-600 hover:underline mb-2 text-sm flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Classes
                </button>
                <h2 className="text-2xl font-bold">{selectedClass.name}</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Invite Code: <span className="font-mono font-bold">{selectedClass.invite_code}</span>
                </p>
              </div>
              <button
                onClick={() => setShowAddSubject(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Subject
              </button>
            </div>

            {subjects.length === 0 ? (
              <div className="text-center py-16">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No subjects added yet</p>
                <button onClick={() => setShowAddSubject(true)} className="btn-primary">
                  Add Your First Subject
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {subjects.map((subject) => (
                  <div
                    key={subject.id}
                    onClick={() => setSelectedSubject(subject)}
                    className="card"
                  >
                    <div className={`w-12 h-12 bg-${subject.color}-500 rounded-lg flex items-center justify-center text-2xl mb-4`}>
                      {subject.icon}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{subject.name}</h3>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Subject selected - show notes */}
        {selectedSubject && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <button
                  onClick={() => setSelectedSubject(null)}
                  className="text-primary-600 hover:underline mb-2 text-sm flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Subjects
                </button>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 bg-${selectedSubject.color}-500 rounded-lg flex items-center justify-center text-xl`}>
                    {selectedSubject.icon}
                  </div>
                  <h2 className="text-2xl font-bold">{selectedSubject.name}</h2>
                </div>
              </div>
              <button
                onClick={() => setShowCreateNote(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Note
              </button>
            </div>

            {notes.length === 0 ? (
              <div className="text-center py-16">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No notes created yet</p>
                <button onClick={() => setShowCreateNote(true)} className="btn-primary">
                  Create Your First Note
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {notes.map((note) => (
                  <div key={note.id} className="card">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{note.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {note.content || 'No content yet...'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modals */}
        {showCreateClass && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
            <div className="bg-white p-6 rounded-xl shadow-2xl max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Create New Class</h3>
              <input
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="Enter class name (e.g., Class 9A)"
                className="input-field mb-4"
                autoFocus
              />
              {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCreateClass(false);
                    setError('');
                    setClassName('');
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button onClick={handleCreateClass} className="btn-primary flex-1">
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {showJoinClass && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
            <div className="bg-white p-6 rounded-xl shadow-2xl max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Join Class</h3>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="Enter invite code"
                className="input-field mb-4"
                autoFocus
              />
              {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowJoinClass(false);
                    setError('');
                    setInviteCode('');
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button onClick={handleJoinClass} className="btn-primary flex-1">
                  Join
                </button>
              </div>
            </div>
          </div>
        )}

        {showAddSubject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
            <div className="bg-white p-6 rounded-xl shadow-2xl max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Add Subject</h3>
              <input
                type="text"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                placeholder="Enter subject name (e.g., Mathematics)"
                className="input-field mb-4"
                autoFocus
              />
              {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAddSubject(false);
                    setError('');
                    setSubjectName('');
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button onClick={handleAddSubject} className="btn-primary flex-1">
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        {showCreateNote && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
            <div className="bg-white p-6 rounded-xl shadow-2xl max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Create Note</h3>
              <input
                type="text"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Enter note title"
                className="input-field mb-4"
                autoFocus
              />
              {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCreateNote(false);
                    setError('');
                    setNoteTitle('');
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button onClick={handleCreateNote} className="btn-primary flex-1">
                  Create
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
