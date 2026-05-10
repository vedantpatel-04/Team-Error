import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import API from '../api/axios';

export default function TripNotes() {
  const { tripId } = useParams();
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [editId, setEditId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchNotes = async () => {
    try {
      const res = await API.get(`/trips/${tripId}/notes`);
      setNotes(res.data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchNotes(); }, [tripId]);

  const addNote = async () => {
    if (!newNote.trim()) return;
    await API.post(`/trips/${tripId}/notes`, { content: newNote });
    setNewNote('');
    fetchNotes();
  };

  const updateNote = async (id) => {
    await API.put(`/trips/${tripId}/notes/${id}`, { content: editContent });
    setEditId(null);
    fetchNotes();
  };

  const deleteNote = async (id) => {
    await API.delete(`/trips/${tripId}/notes/${id}`);
    fetchNotes();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-dark mb-2">📝 Trip Notes</h1>
      <p className="text-gray-500 mb-6">Journal your travel thoughts</p>

      {/* Add Note */}
      <div className="glass-card p-5 mb-6">
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          className="input-field resize-none mb-3"
          placeholder="Write a note..."
          rows={3}
        />
        <button onClick={addNote} className="btn-primary text-sm">💾 Save Note</button>
      </div>

      {/* Notes List */}
      <div className="space-y-4">
        {notes.map(note => (
          <div key={note.id} className="glass-card p-5 animate-fade-in">
            {editId === note.id ? (
              <div>
                <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="input-field resize-none mb-3" rows={3} />
                <div className="flex gap-2">
                  <button onClick={() => updateNote(note.id)} className="btn-primary text-xs">Save</button>
                  <button onClick={() => setEditId(null)} className="btn-outline text-xs">Cancel</button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-gray-400">
                    {new Date(note.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditId(note.id); setEditContent(note.content); }} className="btn-ghost text-xs">✏️ Edit</button>
                    <button onClick={() => deleteNote(note.id)} className="btn-ghost text-xs text-danger">🗑️ Delete</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        {notes.length === 0 && !loading && (
          <div className="text-center py-10 text-gray-400">
            <p className="text-4xl mb-2">📓</p>
            <p>No notes yet. Start journaling!</p>
          </div>
        )}
      </div>
    </div>
  );
}
