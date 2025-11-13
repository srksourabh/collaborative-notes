'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Note, Comment, NoteImage, NoteUrl, User } from '@/types';
import { 
  ArrowLeft, Save, Image as ImageIcon, Link as LinkIcon, 
  Share2, MessageSquare, History, Bold, Italic, 
  List, ListOrdered, Heading1, Heading2, Upload, X,
  Send, Reply, Trash2, Users, User as UserIcon
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface NoteEditorProps {
  noteId: string;
  onBack: () => void;
  currentUserId: string;
}

export default function NoteEditor({ noteId, onBack, currentUserId }: NoteEditorProps) {
  const [note, setNote] = useState<Note | null>(null);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Media & Links
  const [images, setImages] = useState<NoteImage[]>([]);
  const [urls, setUrls] = useState<NoteUrl[]>([]);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showUrlAdd, setShowUrlAdd] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newUrlTitle, setNewUrlTitle] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Comments
  const [comments, setComments] = useState<any[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);

  // Sharing
  const [showShare, setShowShare] = useState(false);
  const [shareWithEmail, setShareWithEmail] = useState('');
  const [shareType, setShareType] = useState<'view' | 'edit'>('view');

  // History
  const [showHistory, setShowHistory] = useState(false);
  const [editHistory, setEditHistory] = useState<any[]>([]);

  // Rich text formatting
  const [selectedText, setSelectedText] = useState('');

  useEffect(() => {
    loadNote();
    loadImages();
    loadUrls();
    loadComments();
  }, [noteId]);

  const loadNote = async () => {
    const { data } = await supabase
      .from('notes')
      .select('*')
      .eq('id', noteId)
      .single();

    if (data) {
      setNote(data);
      setContent(data.content || '');
    }
  };

  const loadImages = async () => {
    const { data } = await supabase
      .from('note_images')
      .select('*')
      .eq('note_id', noteId)
      .order('uploaded_at', { ascending: false });

    setImages(data || []);
  };

  const loadUrls = async () => {
    const { data } = await supabase
      .from('note_urls')
      .select('*')
      .eq('note_id', noteId)
      .order('added_at', { ascending: false });

    setUrls(data || []);
  };

  const loadComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select(`
        *,
        author:users!comments_author_id_fkey(id, full_name, username)
      `)
      .eq('note_id', noteId)
      .order('created_at', { ascending: true });

    setComments(data || []);
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      // Save content
      await supabase
        .from('notes')
        .update({ 
          content,
          updated_at: new Date().toISOString()
        })
        .eq('id', noteId);

      // Log edit history
      await supabase
        .from('edit_history')
        .insert({
          note_id: noteId,
          edited_by: currentUserId,
          content_before: note?.content || '',
          content_after: content,
        });

      setLastSaved(new Date());
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // For demo, we'll use a placeholder. In production, upload to Supabase Storage
    setUploadingImage(true);
    
    try {
      // Simulate upload (in production, use Supabase Storage)
      const placeholderUrl = `https://via.placeholder.com/800x400?text=${encodeURIComponent(file.name)}`;
      
      await supabase
        .from('note_images')
        .insert({
          note_id: noteId,
          image_url: placeholderUrl,
          caption: file.name,
          uploaded_by: currentUserId,
        });

      loadImages();
      setShowImageUpload(false);
    } catch (error) {
      console.error('Error uploading:', error);
      alert('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddUrl = async () => {
    if (!newUrl) return;

    try {
      await supabase
        .from('note_urls')
        .insert({
          note_id: noteId,
          url: newUrl,
          title: newUrlTitle || newUrl,
          added_by: currentUserId,
        });

      loadUrls();
      setNewUrl('');
      setNewUrlTitle('');
      setShowUrlAdd(false);
    } catch (error) {
      console.error('Error adding URL:', error);
      alert('Failed to add URL');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      await supabase
        .from('comments')
        .insert({
          note_id: noteId,
          content: newComment,
          author_id: currentUserId,
          parent_id: replyTo,
        });

      setNewComment('');
      setReplyTo(null);
      loadComments();
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment');
    }
  };

  const handleShareNote = async () => {
    if (!shareWithEmail) return;

    try {
      // Find user by email
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('email', shareWithEmail)
        .single();

      if (!userData) {
        alert('User not found with that email');
        return;
      }

      // Create share
      await supabase
        .from('note_shares')
        .insert({
          note_id: noteId,
          shared_by: currentUserId,
          shared_with_user: userData.id,
          share_type: shareType,
        });

      alert('Note shared successfully!');
      setShareWithEmail('');
      setShowShare(false);
    } catch (error) {
      console.error('Error sharing:', error);
      alert('Failed to share note');
    }
  };

  const loadEditHistory = async () => {
    const { data } = await supabase
      .from('edit_history')
      .select(`
        *,
        edited_by_user:users!edit_history_edited_by_fkey(full_name, username)
      `)
      .eq('note_id', noteId)
      .order('edited_at', { ascending: false })
      .limit(20);

    setEditHistory(data || []);
  };

  const applyFormatting = (format: string) => {
    const textarea = document.getElementById('note-content') as HTMLTextAreaElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);

    let formattedText = '';
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'h1':
        formattedText = `# ${selectedText}`;
        break;
      case 'h2':
        formattedText = `## ${selectedText}`;
        break;
      case 'list':
        formattedText = `- ${selectedText}`;
        break;
      case 'ordered':
        formattedText = `1. ${selectedText}`;
        break;
    }

    const newContent = content.substring(0, start) + formattedText + content.substring(end);
    setContent(newContent);
  };

  if (!note) {
    return <div className="p-8">Loading note...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
            
            <div className="flex items-center gap-3">
              {lastSaved && (
                <span className="text-sm text-gray-500">
                  Saved {formatDistanceToNow(lastSaved)} ago
                </span>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {note.title}
          </h1>

          {/* Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Formatting */}
            <div className="flex items-center gap-1 border-r pr-2">
              <button
                onClick={() => applyFormatting('bold')}
                className="p-2 hover:bg-gray-100 rounded"
                title="Bold"
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                onClick={() => applyFormatting('italic')}
                className="p-2 hover:bg-gray-100 rounded"
                title="Italic"
              >
                <Italic className="w-4 h-4" />
              </button>
              <button
                onClick={() => applyFormatting('h1')}
                className="p-2 hover:bg-gray-100 rounded"
                title="Heading 1"
              >
                <Heading1 className="w-4 h-4" />
              </button>
              <button
                onClick={() => applyFormatting('h2')}
                className="p-2 hover:bg-gray-100 rounded"
                title="Heading 2"
              >
                <Heading2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => applyFormatting('list')}
                className="p-2 hover:bg-gray-100 rounded"
                title="Bullet List"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => applyFormatting('ordered')}
                className="p-2 hover:bg-gray-100 rounded"
                title="Numbered List"
              >
                <ListOrdered className="w-4 h-4" />
              </button>
            </div>

            {/* Actions */}
            <button
              onClick={() => setShowImageUpload(true)}
              className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded"
            >
              <ImageIcon className="w-4 h-4" />
              <span className="text-sm">Image</span>
            </button>
            
            <button
              onClick={() => setShowUrlAdd(true)}
              className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded"
            >
              <LinkIcon className="w-4 h-4" />
              <span className="text-sm">Link</span>
            </button>
            
            <button
              onClick={() => setShowShare(true)}
              className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded"
            >
              <Share2 className="w-4 h-4" />
              <span className="text-sm">Share</span>
            </button>
            
            <button
              onClick={() => {
                setShowComments(!showComments);
                if (!showComments) loadComments();
              }}
              className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm">Comments ({comments.length})</span>
            </button>
            
            <button
              onClick={() => {
                setShowHistory(!showHistory);
                if (!showHistory) loadEditHistory();
              }}
              className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded"
            >
              <History className="w-4 h-4" />
              <span className="text-sm">History</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Editor */}
          <div className="lg:col-span-2 space-y-6">
            {/* Text Editor */}
            <div className="bg-white rounded-xl shadow p-6">
              <textarea
                id="note-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full min-h-[400px] p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-y font-mono text-sm"
                placeholder="Start writing your notes here...

Tip: Use markdown formatting:
**bold** for bold
*italic* for italic
# Heading 1
## Heading 2
- Bullet point
1. Numbered list"
              />
              <p className="text-xs text-gray-500 mt-2">
                💡 Supports Markdown formatting
              </p>
            </div>

            {/* Images */}
            {images.length > 0 && (
              <div className="bg-white rounded-xl shadow p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Images ({images.length})
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {images.map((img) => (
                    <div key={img.id} className="relative group">
                      <img
                        src={img.image_url}
                        alt={img.caption || ''}
                        className="w-full h-40 object-cover rounded-lg"
                      />
                      {img.caption && (
                        <p className="text-sm text-gray-600 mt-2">{img.caption}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* URLs */}
            {urls.length > 0 && (
              <div className="bg-white rounded-xl shadow p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <LinkIcon className="w-5 h-5" />
                  Links ({urls.length})
                </h3>
                <div className="space-y-3">
                  {urls.map((urlItem) => (
                    <a
                      key={urlItem.id}
                      href={urlItem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition"
                    >
                      <LinkIcon className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">{urlItem.title}</p>
                        <p className="text-sm text-gray-500 break-all">{urlItem.url}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Comments */}
            {showComments && (
              <div className="bg-white rounded-xl shadow p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Comments
                </h3>

                {/* Add Comment */}
                <div className="mb-4">
                  {replyTo && (
                    <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                      <Reply className="w-4 h-4" />
                      Replying to comment
                      <button
                        onClick={() => setReplyTo(null)}
                        className="text-primary-600 hover:underline"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                    />
                    <button
                      onClick={handleAddComment}
                      className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Comments List */}
                <div className="space-y-4">
                  {comments.filter(c => !c.parent_id).map((comment) => (
                    <div key={comment.id} className="space-y-2">
                      <div className="border-l-2 border-gray-200 pl-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-sm">
                              {comment.author?.full_name || 'Unknown'}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">{comment.content}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatDistanceToNow(new Date(comment.created_at))} ago
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setReplyTo(comment.id)}
                          className="text-xs text-primary-600 hover:underline mt-2"
                        >
                          Reply
                        </button>
                      </div>

                      {/* Replies */}
                      {comments
                        .filter(c => c.parent_id === comment.id)
                        .map((reply) => (
                          <div key={reply.id} className="ml-6 border-l-2 border-gray-200 pl-3">
                            <p className="font-medium text-sm">
                              {reply.author?.full_name || 'Unknown'}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">{reply.content}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatDistanceToNow(new Date(reply.created_at))} ago
                            </p>
                          </div>
                        ))}
                    </div>
                  ))}

                  {comments.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-8">
                      No comments yet. Start the discussion!
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Edit History */}
            {showHistory && (
              <div className="bg-white rounded-xl shadow p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Edit History
                </h3>
                <div className="space-y-3">
                  {editHistory.map((edit) => (
                    <div key={edit.id} className="border-l-2 border-primary-500 pl-3 py-2">
                      <p className="font-medium text-sm">
                        {edit.edited_by_user?.full_name || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDistanceToNow(new Date(edit.edited_at))} ago
                      </p>
                    </div>
                  ))}

                  {editHistory.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No edit history yet
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Upload Modal */}
      {showImageUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white p-6 rounded-xl shadow-2xl max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Upload Image</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
                disabled={uploadingImage}
              />
              <label
                htmlFor="image-upload"
                className="btn-primary cursor-pointer inline-block"
              >
                {uploadingImage ? 'Uploading...' : 'Choose Image'}
              </label>
              <p className="text-sm text-gray-500 mt-2">PNG, JPG up to 10MB</p>
            </div>
            <button
              onClick={() => setShowImageUpload(false)}
              className="btn-secondary w-full mt-4"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Add URL Modal */}
      {showUrlAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white p-6 rounded-xl shadow-2xl max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Add Link</h3>
            <div className="space-y-4">
              <input
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://example.com"
                className="input-field"
              />
              <input
                type="text"
                value={newUrlTitle}
                onChange={(e) => setNewUrlTitle(e.target.value)}
                placeholder="Link title (optional)"
                className="input-field"
              />
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowUrlAdd(false);
                  setNewUrl('');
                  setNewUrlTitle('');
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button onClick={handleAddUrl} className="btn-primary flex-1">
                Add Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShare && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white p-6 rounded-xl shadow-2xl max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Share Note</h3>
            <div className="space-y-4">
              <input
                type="email"
                value={shareWithEmail}
                onChange={(e) => setShareWithEmail(e.target.value)}
                placeholder="Enter user's email"
                className="input-field"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permission
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShareType('view')}
                    className={`flex-1 py-2 rounded-lg font-medium ${
                      shareType === 'view'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    View Only
                  </button>
                  <button
                    onClick={() => setShareType('edit')}
                    className={`flex-1 py-2 rounded-lg font-medium ${
                      shareType === 'edit'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    Can Edit
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowShare(false);
                  setShareWithEmail('');
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button onClick={handleShareNote} className="btn-primary flex-1">
                Share
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
